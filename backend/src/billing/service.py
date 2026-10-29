from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status

from src.auth.models import User
from src.auth.repository import UserRepository
from src.billing import schemas
from src.billing.models import BillingPeriod, PaymentProvider, Subscription, SubscriptionStatus
from src.billing.paddle_gateway import PaddleGateway, verify_paddle_signature
from src.billing.repository import PaymentRepository, PlanRepository, SubscriptionRepoistory
from src.billing.tasks import (
    send_cancel_subscription_email_task,
    send_payment_failed_email_task,
    send_subscription_email_task,
    send_update_subscription_email_task,
)
from src.billing.utils import serialize_subscription
from src.logging import get_logger

logger = get_logger("billing")


def _dt_now():
    return datetime.now(UTC)


class PlanService:
    def __init__(self, plan_repo: PlanRepository):
        self.plan_repo = plan_repo


    async def retrive_plans(self, limit: int = 50, offset: int = 0):
        plans = await self.plan_repo.paginate_plans(limit=limit, offset=offset)
        logger.info(f"Retrieved plans count={len(plans['data'])}")
        return plans
    

    async def create_plan(self, data: schemas.PlanCreate):
        existing_code = await self.plan_repo.get_by_code(data.code)
        if existing_code :
            logger.warning(f"Attempt to create plan with existing code code={data.code}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Existing Code")
        
        result = await self.plan_repo.create(data.model_dump())
        logger.info(f"Plan created locally plan_id={result.id}, code={result.code}")
        paddle_plan = await PaddleGateway.save_plan_to_paddle(result)
        if paddle_plan:
            updated_plan = await self.plan_repo.update(result, {
                "paddle_product_id": paddle_plan.paddle_product_id,
                "paddle_price_id": paddle_plan.paddle_price_id
            })
            logger.info(
                f"Plan synced to Paddle plan_id={updated_plan.id}, code={updated_plan.code}, "
                f"paddle_product_id={updated_plan.paddle_product_id}, paddle_price_id={updated_plan.paddle_price_id}"
            )
            return updated_plan
        logger.warning(
            f"Plan created without Paddle sync plan_id={result.id}, code={result.code}"
        )
        return result


    async def get_plan_by_id(self, plan_id: UUID):
        plan = await self.plan_repo.get_by_id(plan_id)
        if not plan: 
            logger.warning(f"Plan not found plan_id={plan_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No plan found for this id")
        return plan
    

    async def update_plan(self, plan_id: UUID, data: schemas.PlanUpdate):
        plan = await self.plan_repo.get_by_id(plan_id)
        if not plan: 
            logger.warning(f"Attempt to update non-existing plan plan_id={plan_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No plan found for this id")
        
        update_data = await PaddleGateway.update_plan_in_paddle(plan, data)
        result = await self.plan_repo.update(plan, update_data)    
        logger.info(f"Plan updated plan_id={result.id}, code={result.code}")
        return result
    
    
    async def soft_delete_plan(self, plan_id: UUID):
        plan = await self.plan_repo.get_by_id(plan_id)
        if not plan: 
            logger.warning(f"Attempt to soft delete non-existing plan plan_id={plan_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No plan found for this id")
        if not plan.is_active:
            logger.warning(
                f"Attempt to soft delete already inactive plan plan_id={plan.id}, code={plan.code}"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan already deleted.")
       
        await PaddleGateway.soft_delete_plan_in_paddle(plan)
        await self.plan_repo.soft_delete(plan)
        logger.info(
            f"Plan soft deleted plan_id={plan.id}, code={plan.code}, "
            f"paddle_product_id={plan.paddle_product_id}, paddle_price_id={plan.paddle_price_id}"
        )
    


class SubscriptionService:
    def __init__(self, subscription_repo: SubscriptionRepoistory,
        plan_repo: PlanRepository, user_repo: UserRepository, payment_repo: PaymentRepository) -> None:
        self.subscription_repo = subscription_repo
        self.plan_repo = plan_repo
        self.user_repo = user_repo
        self.payment_repo = payment_repo

        
    async def get_user_subscription(self, user_id: UUID) -> Subscription | None:
        subscription = await self.subscription_repo.get_subscription_with_access(user_id)
        if not subscription:
            logger.info(f"No subscription with access found for user_id={user_id}")
            return None
        logger.info(
            f"Retrieved active subscription for user_id={user_id}, "
            f"subscription_id={subscription.id}, provider={subscription.provider}"
        )
        return subscription
    

    async def subscribe_user_to_plan(self, user: User, plan_code: str):
        logger.info(
            f"Creating subscription user_id={str(user.id)}, email={user.email}, plan_code={plan_code}"
        )
        exisitng_sub = await self.subscription_repo.get_subscription_with_access(user.id)
        if exisitng_sub:
            logger.warning(
                f"Subscription creation rejected: user already has active subscription "
                f"user_id={str(user.id)}, subscription_id={exisitng_sub.id}"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already has an active subscription.")
        plan = await self.plan_repo.get_by_code(plan_code)
        if not plan:
            logger.warning(
                f"Subscription creation failed: plan not found plan_code={plan_code}, user_id={str(user.id)}"
            )
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active plan found for this code.")

        # Sandbox without Paddle: a free plan (price 0, no paddle_price_id) is activated
        # locally so the dashboard works without configuring API keys.
        if not plan.paddle_price_id and (plan.price_cents or 0) == 0:
            now = _dt_now()
            billing_period = getattr(plan, "billing_period", BillingPeriod.MONTHLY)
            period_days = 365 if billing_period in (BillingPeriod.YEARLY, "yearly") else 30
            sub = await self.subscription_repo.create_subscription(
                user.id, plan.id, PaymentProvider.MANUAL, f"manual-{user.id}-{plan.code}",
                "", SubscriptionStatus.ACTIVE,
                current_period_end=now + timedelta(days=period_days),
            )
            logger.info(f"Free plan activated locally user_id={user.id} plan={plan.code}")
            return {"checkout_url": "", "transaction_id": None,
                    "paddle_price_id": None, "activated_locally": True,
                    "subscription_id": str(sub.id)}

        try:
            checkout = await PaddleGateway.create_subscription_checkout_session(user, plan, self.user_repo)
        except HTTPException as e:
            if e.status_code in (500, 502):
                raise HTTPException(
                    status_code=503,
                    detail="Paddle is not configured in sandbox (PADDLE_API_KEY). "
                           "The web app and plans work; set the keys to test checkout.",
                ) from e
            raise
        logger.info(
            f"Paddle transaction created for subscription user_id={str(user.id)}, "
            f"email={user.email}, plan_code={plan_code}"
        )
        return checkout

    
    async def cancel_subscription_at_end_of_period(self, user_id: UUID):
        logger.info(
            f"Cancel subscription at period end requested user_id={str(user_id)}"
        )
        sub = await self.subscription_repo.get_subscription_with_access(user_id)
        if not sub:
            logger.warning(
                f"Cancel subscription failed: no active subscription user_id={str(user_id)}"
            )
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active subscription found for this user.")

        if sub.cancel_at_period_end is True: #type: ignore
            logger.warning(
                f"Cancel subscription failed: already set to cancel at period end "
                f"user_id={str(user_id)}, subscription_id={sub.id}"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is already set to cancel at the end of the billing period.")
        
        if sub.provider == PaymentProvider.PADDLE:
            canceled_at, current_period_end = await PaddleGateway.cancel_subscription_at_period_end(sub)
        else:
            # MANUAL / legacy providers: local-only cancel at period end
            canceled_at, current_period_end = _dt_now(), sub.current_period_end

        updated_sub = await self.subscription_repo.cancel_subscription(
            provider=sub.provider,
            provider_subscription_id=sub.provider_subscription_id,
            canceled_at=canceled_at,
            current_period_end=current_period_end,
        )
        if updated_sub is None:
            logger.error(
                f"Cancel subscription failed in DB user_id={str(user_id)}, "
                f"provider={sub.provider}, provider_subscription_id={sub.provider_subscription_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found in our database.",
            )
        
        logger.info(
            f"Subscription marked to cancel at period end user_id={str(user_id)}, "
            f"subscription_id={updated_sub.id}, provider={updated_sub.provider}"
        )
        return updated_sub


    async def upgrade_subscription(self, user: User, new_plan_code: str) :
        
        logger.info(
            f"Upgrade subscription requested user_id={str(user.id)}, "
            f"email={user.email}, new_plan_code={new_plan_code}"
        )

        current_sub = await self.subscription_repo.get_subscription_with_access(user.id)
        if not current_sub:
            logger.warning(
                f"Upgrade subscription failed: no active subscription user_id={str(user.id)}"
            )
            raise HTTPException(status_code=404, detail="No active subscription to upgrade.")
        
        new_plan = await self.plan_repo.get_by_code(new_plan_code)
        if not new_plan:
            logger.warning(
                f"Upgrade subscription failed: plan not found user_id={str(user.id)}, "
                f"new_plan_code={new_plan_code}"
            )
            raise HTTPException(status_code=404, detail="Plan not found.")
        
        if new_plan.id == current_sub.plan_id:
            logger.warning(
                f"Upgrade subscription rejected: already on this plan user_id={str(user.id)}, "
                f"plan_id={new_plan.id}"
            )
            raise HTTPException(status_code=400, detail="You are already on this plan.")

        # Tier guard: prevent silent downgrades unless explicitly allowed
        try:
            cur_plan = await self.plan_repo.get_by_id(current_sub.plan_id)
            if cur_plan and getattr(new_plan, "tier", 0) < getattr(cur_plan, "tier", 0):
                raise HTTPException(status_code=400, detail="Downgrade requires cancel + resubscribe.")
        except HTTPException:
            raise
        except Exception:
            pass

        if current_sub.provider == PaymentProvider.PADDLE and new_plan.paddle_price_id:
            # In-place proration upgrade when possible
            try:
                await PaddleGateway.update_subscription_price(
                    current_sub.provider_subscription_id, new_plan.paddle_price_id)
                logger.info(f"Paddle subscription updated in place user_id={user.id}")
                current_sub_id = getattr(current_sub, "id", None)
                return {"checkout_url": "", "transaction_id": None,
                        "paddle_price_id": new_plan.paddle_price_id, "updated_in_place": True,
                        "subscription_id": str(current_sub_id) if current_sub_id else None}
            except Exception as e:
                logger.warning(f"In-place upgrade failed, falling back to checkout: {e}")

        checkout = await PaddleGateway.create_subscription_checkout_session(
            user, new_plan, self.user_repo, current_sub.provider_subscription_id)

        logger.info(
            f"Paddle transaction created for upgrade user_id={str(user.id)}, "
            f"email={user.email}, new_plan_code={new_plan_code}"
        )
        return checkout


    async def paddle_webhook(self, request, paddle_signature: str):
        raw = await request.body()
        verify_paddle_signature(raw, paddle_signature or "")
        import json as _json
        try:
            event = _json.loads(raw.decode("utf-8"))
        except Exception as e:
            logger.error(f"Paddle webhook invalid JSON: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON") from e

        event_type = event.get("event_type") or event.get("type")
        data = event.get("data") or {}
        logger.info(f"Processing Paddle webhook event_type={event_type}")

        if event_type in ("subscription.created", "subscription.updated"):
            sub = await PaddleGateway.handle_subscription_updated(data, self.subscription_repo)
            if sub is None:
                # First-time: create from custom_data
                sub = await PaddleGateway.user_subscribe(data, self.subscription_repo, self.plan_repo)
            if sub:
                if event_type == "subscription.updated":
                    send_update_subscription_email_task.delay(serialize_subscription(sub))
                else:
                    send_subscription_email_task.delay(serialize_subscription(sub))
            return {"ok": True}

        if event_type == "subscription.canceled":
            sub = await PaddleGateway.handle_subscription_canceled(data, self.subscription_repo)
            try:
                send_cancel_subscription_email_task.delay(serialize_subscription(sub))
            except Exception as exc:
                logger.exception(f"Failed to enqueue cancel email: {exc}")
            return {"ok": True}

        if event_type in ("transaction.completed", "transaction.updated"):
            # Find subscription via custom_data or subscription_id
            custom = data.get("custom_data") or {}
            provider_sub_id = data.get("subscription_id") or custom.get("subscription_id", "")
            sub = None
            if provider_sub_id:
                sub = await self.subscription_repo.get_by_provider_subscription_id(
                    provider=PaymentProvider.PADDLE, provider_subscription_id=str(provider_sub_id))
            if sub is None:
                sub = await PaddleGateway.user_subscribe(data, self.subscription_repo, self.plan_repo)
            if sub is None:
                logger.error("transaction.completed: subscription not found, skipping")
                return {"ok": True}
            try:
                await PaddleGateway.record_transaction_payment(data, sub, self.payment_repo)
            except Exception as e:
                # idempotency: duplicate txn -> ignore
                if "uq_provider_invoice_id" in str(e) or "UniqueViolation" in str(e) or "duplicate" in str(e).lower():
                    logger.warning(f"Duplicate transaction ignored txn={data.get('id')}")
                else:
                    raise
            send_subscription_email_task.delay(serialize_subscription(sub))
            return {"ok": True}

        if event_type in ("transaction.payment_failed", "transaction.updated.payment_failed"):
            sub = await PaddleGateway.handle_transaction_failed(data, self.subscription_repo)
            if sub:
                send_payment_failed_email_task.delay(serialize_subscription(sub))
            return {"ok": True}

        logger.info(f"Ignoring Paddle event {event_type}")
        return {"ok": True}


    async def stripe_webhook(self, request, stripe_signature):
        raise HTTPException(status_code=410, detail="Stripe webhook retired, use /billing/paddle/webhook")



class PaymentService:
    def __init__(self, payment_repo: PaymentRepository) -> None:
        self.payment_repo = payment_repo


    async def get_my_payments(self, user: User, limit: int = 50, offset: int = 0):
        payments = await self.payment_repo.paginate_my_payments(user.id, limit=limit, offset=offset)
        logger.info(
                f"Retrieved payments for user_id={str(user.id)}, count={len(payments['data'])}"
            )
        return payments