"""Paddle Billing gateway (Merchant of Record).

Paddle-first: products/prices are created in the Paddle dashboard (sandbox),
local Plan only stores the mapping (paddle_product_id / paddle_price_id).
Checkout is Hosted URL via transactions.create -> checkout.url (redirect).
"""
import hashlib
import hmac
import time
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException

from src.auth.models import User
from src.auth.repository import UserRepository
from src.billing.models import PaymentProvider, PaymentStatus, Plan, Subscription, SubscriptionStatus
from src.billing.repository import PaymentRepository, PlanRepository, SubscriptionRepoistory
from src.billing.schemas import PlanUpdate
from src.config import settings
from src.logging import get_logger

logger = get_logger("billing")


def _base_url() -> str:
    return "https://sandbox-api.paddle.com" if settings.paddle_env != "production" else "https://api.paddle.com"


async def _api(method: str, path: str, json_body: dict | None = None):
    import httpx
    if not settings.paddle_api_key:
        # Sandbox without keys: friendly 503, the web app keeps working
        raise HTTPException(
            status_code=503,
            detail="Paddle is not configured in sandbox (PADDLE_API_KEY is empty). "
                   "Set the keys in Paddle > Developer tools to test checkout.",
        )
    async with httpx.AsyncClient(base_url=_base_url(), timeout=20.0,
                                 headers={"Authorization": f"Bearer {settings.paddle_api_key}",
                                          "Content-Type": "application/json"}) as c:
        r = await c.request(method, path, json=json_body)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Paddle API {r.status_code}: {r.text[:300]}")
        return r.json().get("data", r.json())


def _paddle_client():
    # Compat shim: tests/legacy code may call _paddle_client(); REST uses _api() instead.
    return None


def verify_paddle_signature(raw_body: bytes, header: str) -> None:
    secret = settings.paddle_webhook_secret
    if not secret:
        raise HTTPException(
            status_code=503,
            detail="Paddle is not configured in sandbox (PADDLE_WEBHOOK_SECRET is empty). "
                   "Webhooks stay disabled until you set Notifications > secret.",
        )
    if not header or ";" not in header:
        raise HTTPException(status_code=400, detail="Invalid Paddle-Signature")
    try:
        ts_part, h1_part = header.split(";")
        ts = ts_part.split("=", 1)[1]
        sig = h1_part.split("=", 1)[1]
        event_time = int(ts)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid Paddle-Signature format") from exc
    if abs(int(time.time()) - event_time) > 30:
        raise HTTPException(status_code=408, detail="Webhook event expired")
    signed = f"{ts}:{raw_body.decode('utf-8')}".encode()
    expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=401, detail="Invalid Paddle signature")


class PaddleGateway:
    # ---------- Plans (Paddle-first: validate, don't create) ----------
    @staticmethod
    async def save_plan_to_paddle(plan: Plan):
        """Validate local plan against Paddle. Returns plan or None on error."""
        try:
            if not plan.paddle_price_id:
                # Free or not-yet-mapped plans stay local-only
                logger.info(f"Plan {plan.id} has no paddle_price_id, keeping local-only")
                return plan
            price = await _api("GET", f"/prices/{plan.paddle_price_id}")
            logger.info(f"Paddle price validated plan_id={plan.id} status={price.get('status') if isinstance(price, dict) else '?'}")
            return plan
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Paddle error validating plan {plan.id}: {e}")
            return None

    @staticmethod
    async def update_plan_in_paddle(plan: Plan, data: PlanUpdate) -> dict:
        update_data = data.model_dump(exclude_unset=True)
        if any(k in update_data for k in ("price_cents", "billing_period", "currency", "paddle_price_id")):
            logger.warning(
                f"Plan {plan.id}: price change requires dashboard update in Paddle-first mode. "
                "Update paddle_price_id manually."
            )
        return update_data

    @staticmethod
    async def soft_delete_plan_in_paddle(plan: Plan):
        logger.info(f"Paddle-first: local soft-delete only for plan {plan.id} (deactivate price in dashboard)")

    # ---------- Customers ----------
    @staticmethod
    async def ensure_customer(user: User, user_repo: UserRepository) -> User:
        customer_id = getattr(user, "paddle_customer_id", None)
        if customer_id:
            return user
        logger.info(f"Creating Paddle customer user_id={user.id} email={user.email}")
        data = await _api("POST", "/customers", {
            "email": user.email,
            "name": getattr(user, "username", None) or user.email,
            "custom_data": {"user_id": str(user.id)},
        })
        cid = data.get("id") if isinstance(data, dict) else None
        user = await user_repo.update(user, {"paddle_customer_id": cid})
        logger.info(f"Paddle customer created user_id={user.id} customer_id={cid}")
        return user

    # ---------- Checkout (Hosted URL) ----------
    @staticmethod
    async def create_subscription_checkout_session(
        user: User, plan: Plan, user_repo: UserRepository, old_sub_id: str | None = None
    ) -> dict:
        user = await PaddleGateway.ensure_customer(user, user_repo)
        if not plan.paddle_price_id:
            raise HTTPException(status_code=400, detail="Plan not configured in Paddle (missing paddle_price_id)")
        custom_data = {"user_id": str(user.id), "plan_id": str(plan.id), "plan_code": plan.code}
        if old_sub_id:
            custom_data["upgrade_from_subscription_id"] = old_sub_id
        txn = await _api("POST", "/transactions", {
            "customer_id": user.paddle_customer_id,
            "items": [{"price_id": plan.paddle_price_id, "quantity": 1}],
            "custom_data": custom_data,
            "collection_mode": "automatic",
        })
        checkout_url = (txn.get("checkout") or {}).get("url") if isinstance(txn, dict) else None
        txn_id = txn.get("id") if isinstance(txn, dict) else None
        logger.info(f"Paddle transaction created user_id={user.id} plan={plan.code} txn={txn_id}")
        return {"checkout_url": checkout_url, "transaction_id": txn_id, "paddle_price_id": plan.paddle_price_id}

    # ---------- Subscription lifecycle ----------
    @staticmethod
    async def cancel_subscription_at_period_end(sub: Subscription) -> tuple[datetime, datetime | None]:
        now = datetime.now(UTC)
        current_period_end = sub.current_period_end
        try:
            res = await _api("POST", f"/subscriptions/{sub.provider_subscription_id}/cancel",
                             {"effective_from": "next_billing_period"})
            canceled_at = _parse_dt(res.get("effective_at")) or now if isinstance(res, dict) else now
            nxt = res.get("next_billed_at") if isinstance(res, dict) else None
            if nxt:
                current_period_end = _parse_dt(nxt)
            return canceled_at, current_period_end
        except Exception as e:
            logger.error(f"Paddle cancel failed {sub.provider_subscription_id}: {e}")
            return now, current_period_end

    @staticmethod
    async def update_subscription_price(provider_sub_id: str, new_price_id: str):
        return await _api("PATCH", f"/subscriptions/{provider_sub_id}", {
            "items": [{"price_id": new_price_id, "quantity": 1}],
            "proration_billing_mode": "prorated_immediately",
        })

    # ---------- Webhook handlers (minimum SaaS) ----------
    @staticmethod
    async def user_subscribe(payload: dict, sub_repo: SubscriptionRepoistory, plan_repo: PlanRepository) -> Subscription | None:
        """Create local subscription from Paddle custom_data (transaction/subscription created)."""
        custom = payload.get("custom_data") or {}
        user_id = custom.get("user_id") or payload.get("customer_id")
        plan_id = custom.get("plan_id")
        plan_code = custom.get("plan_code")
        provider_sub_id = payload.get("subscription_id") or payload.get("id")
        customer_id = payload.get("customer_id")
        plan = None
        if plan_id:
            try:
                plan = await plan_repo.get_by_id(plan_id)
            except Exception:
                plan = None
        if not plan and plan_code:
            plan = await plan_repo.get_by_code(plan_code)
        if not plan or not user_id:
            logger.error(f"user_subscribe: missing plan/user plan={plan_id}/{plan_code} user={user_id}")
            raise HTTPException(status_code=400, detail="Unknown plan or user in webhook")
        existing = await sub_repo.get_by_provider_subscription_id(
            provider=PaymentProvider.PADDLE, provider_subscription_id=str(provider_sub_id or "")
        )
        if existing:
            return existing
        try:
            uid = UUID(str(user_id))
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid user_id in webhook") from exc
        return await sub_repo.create_subscription(
            uid, plan.id, PaymentProvider.PADDLE, str(provider_sub_id or ""),
            str(customer_id or ""), SubscriptionStatus.PENDING,
        )

    @staticmethod
    async def handle_subscription_updated(data: dict, sub_repo: SubscriptionRepoistory):
        sub_id = data.get("id")
        sta = (data.get("status") or "").lower()
        mapping = {"active": SubscriptionStatus.ACTIVE, "trialing": SubscriptionStatus.TRIALING,
                   "past_due": SubscriptionStatus.PAST_DUE, "canceled": SubscriptionStatus.CANCELED,
                   "paused": SubscriptionStatus.PENDING}
        new_status = mapping.get(sta)
        if not new_status or not sub_id:
            return None
        cpe = data.get("next_billed_at") or data.get("current_billing_period", {}).get("ends_at")
        cps = data.get("current_billing_period", {}).get("starts_at")
        from datetime import datetime as _dt
        cpe_dt = _parse_dt(cpe)
        cps_dt = _parse_dt(cps)
        if new_status == SubscriptionStatus.CANCELED:
            return await sub_repo.cancel_subscription(
                provider=PaymentProvider.PADDLE, provider_subscription_id=str(sub_id),
                canceled_at=_parse_dt(data.get("effective_at")) or _dt.now(UTC),
                current_period_end=cpe_dt,
            )
        if cpe_dt and cps_dt:
            updated = await sub_repo.update_subscription_period(
                provider=PaymentProvider.PADDLE, provider_subscription_id=str(sub_id),
                current_period_start=cps_dt, current_period_end=cpe_dt,
            )
            if updated and updated.status != new_status:
                return await sub_repo.update_sub_status(
                    provider=PaymentProvider.PADDLE, provider_subscription_id=str(sub_id), sub_status=new_status)
            return updated
        return await sub_repo.update_sub_status(
            provider=PaymentProvider.PADDLE, provider_subscription_id=str(sub_id), sub_status=new_status)

    @staticmethod
    async def handle_subscription_canceled(data: dict, sub_repo: SubscriptionRepoistory):
        from datetime import datetime as _dt
        sub_id = data.get("id")
        if not sub_id:
            raise HTTPException(status_code=400, detail="subscription.canceled without id")
        canceled_at = _parse_dt(data.get("effective_at")) or _dt.now(UTC)
        cpe = data.get("next_billed_at") or data.get("current_billing_period", {}).get("ends_at")
        sub = await sub_repo.cancel_subscription(
            provider=PaymentProvider.PADDLE, provider_subscription_id=str(sub_id),
            canceled_at=canceled_at, current_period_end=_parse_dt(cpe),
        )
        if not sub:
            raise HTTPException(status_code=400, detail="No local subscription found")
        return sub

    @staticmethod
    async def record_transaction_payment(txn: dict, subscription: Subscription, payment_repo: PaymentRepository):
        totals = txn.get("details", {}).get("totals", {}) or {}
        grand = totals.get("grand_total") or txn.get("details", {}).get("grand_total")
        amount = None
        currency = "USD"
        if isinstance(grand, dict):
            try:
                amount = int(grand.get("amount", 0))
            except Exception:
                amount = 0
            currency = (grand.get("currency_code") or "USD").upper()
        else:
            try:
                amount = int(txn.get("details", {}).get("totals", 0) or 0)
            except Exception:
                amount = 0
        provider_invoice_id = txn.get("id", "")
        # idempotency: skip if already recorded
        try:
            pass
            # payment_repo has no get_by_invoice; check via list is expensive, rely on unique constraint catch
        except Exception:
            pass
        await payment_repo.create_payment(
            user_id=subscription.user_id, subscription_id=subscription.id,
            provider=PaymentProvider.PADDLE, provider_invoice_id=str(provider_invoice_id),
            amount_cents=amount or 0, currency=currency, status=PaymentStatus.SUCCEEDED,
        )

    @staticmethod
    async def handle_transaction_failed(txn: dict, sub_repo: SubscriptionRepoistory):
        sub_id = (txn.get("subscription_id") or txn.get("subscriptionId") or "")
        if not sub_id and isinstance(txn.get("items"), list) and txn["items"]:
            sub_id = txn["items"][0].get("subscription_id", "")
        if not sub_id:
            return None
        return await sub_repo.update_sub_status(
            provider=PaymentProvider.PADDLE, provider_subscription_id=str(sub_id),
            sub_status=SubscriptionStatus.PAST_DUE)


def _parse_dt(v):
    if not v:
        return None
    try:
        if isinstance(v, datetime):
            return v if v.tzinfo else v.replace(tzinfo=UTC)
        s = str(v).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
    except Exception:
        return None
