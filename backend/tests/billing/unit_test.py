from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import ANY, AsyncMock, Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from src.billing.models import BillingPeriod, PaymentProvider
from src.billing.schemas import PlanCreate, PlanUpdate
from src.billing.service import PaymentService, PlanService, SubscriptionService

pytestmark = pytest.mark.asyncio


def _dummy_request(payload: bytes = b"{}"):
    class DummyRequest:
        def __init__(self, data: bytes):
            self._payload = data

        async def body(self):
            return self._payload
    return DummyRequest(payload)


async def test_retrieve_plans():
    repo = Mock()
    repo.paginate_plans = AsyncMock(return_value={
        "data": ["p1", "p2"], "total": 2, "limit": 50, "offset": 0,
        "has_next": False, "next_offset": None, "prev_offset": None,
    })

    service = PlanService(repo)
    result = await service.retrive_plans()

    assert result["data"] == ["p1", "p2"]
    repo.paginate_plans.assert_awaited_once()


async def test_create_plan_updates_paddle_ids(monkeypatch):
    repo = Mock()
    repo.get_by_code = AsyncMock(return_value=None)
    created_plan = SimpleNamespace(
        id=uuid4(),
        code="BASIC",
        name="Basic",
        price_cents=10,
        currency="USD",
        paddle_product_id=None,
        paddle_price_id=None,
    )
    repo.create = AsyncMock(return_value=created_plan)
    updated_plan = SimpleNamespace(
        id=created_plan.id,
        code="BASIC",
        name="Basic",
        price_cents=10,
        currency="USD",
        paddle_product_id="prod_1",
        paddle_price_id="price_1",
    )
    repo.update = AsyncMock(return_value=updated_plan)

    paddle_mock = AsyncMock(return_value=SimpleNamespace(paddle_product_id="prod_1", paddle_price_id="price_1"))
    monkeypatch.setattr("src.billing.service.PaddleGateway.save_plan_to_paddle", paddle_mock)

    data = PlanCreate(code="BASIC", price_cents=10, name="Basic", billing_period=BillingPeriod.MONTHLY)

    service = PlanService(repo)
    result = await service.create_plan(data)

    assert result == updated_plan
    repo.update.assert_awaited_once_with(created_plan, {"paddle_product_id": "prod_1", "paddle_price_id": "price_1"})


async def test_create_plan_skips_paddle_when_failing(monkeypatch):
    repo = Mock()
    repo.get_by_code = AsyncMock(return_value=None)
    created_plan = SimpleNamespace(id=uuid4(), code="BASIC", name="Basic", price_cents=10, currency="USD")
    repo.create = AsyncMock(return_value=created_plan)
    repo.update = AsyncMock()

    monkeypatch.setattr("src.billing.service.PaddleGateway.save_plan_to_paddle", AsyncMock(return_value=None))

    data = PlanCreate(code="BASIC", price_cents=10, name="Basic", billing_period=BillingPeriod.MONTHLY)

    service = PlanService(repo)
    result = await service.create_plan(data)

    assert result == created_plan
    repo.update.assert_not_called()


async def test_create_plan_duplicate_code():
    repo = Mock()
    repo.get_by_code = AsyncMock(return_value=True)

    data = PlanCreate(code="BASIC", price_cents=10, name="Basic", billing_period=BillingPeriod.MONTHLY)

    with pytest.raises(HTTPException) as exc:
        service = PlanService(repo)
        await service.create_plan(data)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Existing Code"


async def test_get_plan_not_found():
    repo = Mock()
    repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(HTTPException):
        service = PlanService(repo)
        await service.get_plan_by_id(uuid4())


async def test_update_plan_success(monkeypatch):
    plan = Mock()
    repo = Mock()
    repo.get_by_id = AsyncMock(return_value=plan)
    repo.update = AsyncMock(return_value=SimpleNamespace(id=uuid4(), code="CODE", updated=True))

    update_data = {"price_cents": 25}
    monkeypatch.setattr("src.billing.service.PaddleGateway.update_plan_in_paddle", AsyncMock(return_value=update_data))

    data = PlanUpdate(price_cents=25)

    service = PlanService(repo)
    result = await service.update_plan(uuid4(), data)

    assert result.updated is True
    repo.update.assert_awaited_once_with(plan, update_data)


async def test_soft_delete_plan_success():
    plan = Mock(is_active=True)
    repo = Mock()
    repo.get_by_id = AsyncMock(return_value=plan)
    repo.soft_delete = AsyncMock()

    service = PlanService(repo)
    await service.soft_delete_plan(uuid4())

    repo.soft_delete.assert_awaited_once()


async def test_soft_delete_already_deleted():
    plan = Mock(is_active=False)
    repo = Mock()
    repo.get_by_id = AsyncMock(return_value=plan)

    with pytest.raises(HTTPException) as exc:
        service = PlanService(repo)
        await service.soft_delete_plan(uuid4())

    assert exc.value.status_code == 400
    assert exc.value.detail == "Plan already deleted."


async def test_soft_delete_plan_not_found():
    repo = Mock()
    repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        service = PlanService(repo)
        await service.soft_delete_plan(uuid4())

    assert exc.value.status_code == 404


async def test_get_user_subscription_success():
    repo = Mock()
    subscription_obj = SimpleNamespace(id=uuid4(), provider=PaymentProvider.PADDLE)
    repo.get_subscription_with_access = AsyncMock(return_value=subscription_obj)

    user_id = uuid4()
    service = SubscriptionService(repo, Mock(), Mock(), Mock())
    result = await service.get_user_subscription(user_id)

    assert result == subscription_obj
    repo.get_subscription_with_access.assert_awaited_once_with(user_id)


async def test_get_user_subscription_returns_none():
    repo = Mock()
    repo.get_subscription_with_access = AsyncMock(return_value=None)

    service = SubscriptionService(repo, Mock(), Mock(), Mock())
    result = await service.get_user_subscription(uuid4())

    assert result is None
    repo.get_subscription_with_access.assert_awaited_once()


async def test_subscribe_user_success(monkeypatch):
    user = SimpleNamespace(id=uuid4(), email="user@test.com")

    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=None)

    plan = SimpleNamespace(
        id=uuid4(),
        code="BASIC",
        price_cents=1000,
        billing_period=BillingPeriod.MONTHLY,
        paddle_price_id="pri_test",
    )
    plan_repo = Mock()
    plan_repo.get_by_code = AsyncMock(return_value=plan)

    user_repo = Mock()

    checkout_mock = AsyncMock(return_value={"checkout_url": "https://sandbox-paddle.test/checkout?txn=txn_test", "transaction_id": "txn_test", "paddle_price_id": "pri_test"})
    monkeypatch.setattr("src.billing.service.PaddleGateway.create_subscription_checkout_session", checkout_mock)

    service = SubscriptionService(sub_repo, plan_repo, user_repo, Mock())
    result = await service.subscribe_user_to_plan(user, "BASIC")

    assert result["checkout_url"] == "https://sandbox-paddle.test/checkout?txn=txn_test"
    checkout_mock.assert_awaited_once_with(user, plan, user_repo)


async def test_subscribe_user_already_has_subscription():
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=SimpleNamespace(id=uuid4()))

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
        await service.subscribe_user_to_plan(SimpleNamespace(id=uuid4(), email="u@test.com"), "BASIC")

    assert exc.value.detail == "User already has an active subscription."


async def test_subscribe_user_plan_not_found():
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=None)

    plan_repo = Mock()
    plan_repo.get_by_code = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, plan_repo, Mock(), Mock())
        await service.subscribe_user_to_plan(SimpleNamespace(id=uuid4(), email="u@test.com"), "UNKNOWN")

    assert exc.value.detail == "No active plan found for this code."


async def test_cancel_subscription_success(monkeypatch):
    subscription = SimpleNamespace(
        id=uuid4(),
        cancel_at_period_end=False,
        provider=PaymentProvider.PADDLE,
        provider_subscription_id="sub_test",
        current_period_end=datetime.now(UTC) + timedelta(days=10),
    )

    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=subscription)
    sub_repo.cancel_subscription = AsyncMock(
        return_value=SimpleNamespace(
            id=uuid4(),
            provider=PaymentProvider.PADDLE,
            cancel_at_period_end=True,
            status="canceled",
        )
    )

    monkeypatch.setattr(
        "src.billing.service.PaddleGateway.cancel_subscription_at_period_end",
        AsyncMock(return_value=(datetime.now(UTC), subscription.current_period_end)),
    )

    service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
    result = await service.cancel_subscription_at_end_of_period(uuid4())

    assert result.cancel_at_period_end is True
    sub_repo.cancel_subscription.assert_awaited_once_with(
        provider=subscription.provider,
        provider_subscription_id=subscription.provider_subscription_id,
        canceled_at=ANY,
        current_period_end=subscription.current_period_end,
    )


async def test_cancel_subscription_already_marked():
    subscription = SimpleNamespace(id=uuid4(), cancel_at_period_end=True)
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=subscription)

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
        await service.cancel_subscription_at_end_of_period(uuid4())

    assert exc.value.detail == "Subscription is already set to cancel at the end of the billing period."


async def test_cancel_subscription_not_found():
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
        await service.cancel_subscription_at_end_of_period(uuid4())

    assert exc.value.status_code == 404


async def test_cancel_subscription_missing_local_record(monkeypatch):
    subscription = SimpleNamespace(
        cancel_at_period_end=False,
        provider=PaymentProvider.PADDLE,
        provider_subscription_id="sub_test",
        current_period_end=datetime.now(UTC) + timedelta(days=10),
    )
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=subscription)
    sub_repo.cancel_subscription = AsyncMock(return_value=None)

    monkeypatch.setattr(
        "src.billing.service.PaddleGateway.cancel_subscription_at_period_end",
        AsyncMock(return_value=(datetime.now(UTC), subscription.current_period_end)),
    )

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
        await service.cancel_subscription_at_end_of_period(uuid4())

    assert exc.value.status_code == 404
    assert exc.value.detail == "Subscription not found in our database."


async def test_upgrade_subscription_success(monkeypatch):
    user = SimpleNamespace(id=uuid4(), email="user@test.com")
    current_sub = SimpleNamespace(
        provider=PaymentProvider.PADDLE,
        provider_subscription_id="sub_old",
        plan_id=uuid4(),
    )
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=current_sub)

    new_plan = SimpleNamespace(id=uuid4(), code="NEW", paddle_price_id=None)
    plan_repo = Mock()
    plan_repo.get_by_code = AsyncMock(return_value=new_plan)
    plan_repo.get_by_id = AsyncMock(return_value=None)

    user_repo = Mock()
    checkout_mock = AsyncMock(return_value={"checkout_url": "https://sandbox-paddle.test/checkout?txn=txn_test", "transaction_id": "txn_test", "paddle_price_id": "pri_test"})
    monkeypatch.setattr("src.billing.service.PaddleGateway.create_subscription_checkout_session", checkout_mock)
    monkeypatch.setattr("src.billing.service.PaddleGateway.update_subscription_price", AsyncMock(side_effect=Exception("no-inplace")))

    service = SubscriptionService(sub_repo, plan_repo, user_repo, Mock())
    result = await service.upgrade_subscription(user, "NEW")

    assert result["checkout_url"] == "https://sandbox-paddle.test/checkout?txn=txn_test"
    checkout_mock.assert_awaited_once()


async def test_upgrade_subscription_same_plan():
    plan_id = uuid4()
    current_sub = SimpleNamespace(plan_id=plan_id)
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=current_sub)

    plan_repo = Mock()
    plan_repo.get_by_code = AsyncMock(return_value=SimpleNamespace(id=plan_id))

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, plan_repo, Mock(), Mock())
        await service.upgrade_subscription(SimpleNamespace(id=uuid4(), email="u@test.com"), "CODE")

    assert exc.value.detail == "You are already on this plan."


async def test_upgrade_subscription_plan_not_found():
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=SimpleNamespace(plan_id=uuid4()))

    plan_repo = Mock()
    plan_repo.get_by_code = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, plan_repo, Mock(), Mock())
        await service.upgrade_subscription(SimpleNamespace(id=uuid4(), email="u@test.com"), "CODE")

    assert exc.value.detail == "Plan not found."


async def test_upgrade_subscription_no_active():
    sub_repo = Mock()
    sub_repo.get_subscription_with_access = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as exc:
        service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
        await service.upgrade_subscription(SimpleNamespace(id=uuid4(), email="u@test.com"), "CODE")

    assert exc.value.detail == "No active subscription to upgrade."


async def test_paddle_webhook_subscription_created(monkeypatch):
    import json as _json
    payload = {"event_type": "subscription.created", "data": {"id": "sub_123", "customer_id": "ctm_123", "custom_data": {}, "status": "active"}}
    raw = _json.dumps(payload).encode()
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", lambda *a, **k: None)
    updated_sub = SimpleNamespace(
        id=uuid4(), user_id=uuid4(),
        user=SimpleNamespace(email="e", username="u"),
        plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=datetime.now(UTC),
        current_period_end=datetime.now(UTC) + timedelta(days=30),
    )
    sub_repo = AsyncMock()
    sub_repo.update_sub_status = AsyncMock(return_value=updated_sub)
    request = _dummy_request(raw)
    service = SubscriptionService(sub_repo, AsyncMock(), AsyncMock(), AsyncMock())
    result = await service.paddle_webhook(request, "ts=1;h1=abc")
    assert result == {"ok": True}


async def test_paddle_webhook_transaction_completed(monkeypatch, mock_send_update_subscription_email_task):
    import json as _json
    txn = {"id": "txn_1", "subscription_id": "sub_123", "customer_id": "ctm_123",
           "details": {"totals": {"grand_total": {"amount": "5000", "currency_code": "USD"}}}, "custom_data": {}}
    payload = {"event_type": "transaction.completed", "data": txn}
    raw = _json.dumps(payload).encode()
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", lambda *a, **k: None)
    updated_sub = SimpleNamespace(id=__import__("uuid").uuid4(), user_id=__import__("uuid").uuid4(),
        user=SimpleNamespace(email="e", username="u"), plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        current_period_end=__import__("datetime").datetime.now(__import__("datetime").timezone.utc) + __import__("datetime").timedelta(days=30))
    monkeypatch.setattr("src.billing.service.PaddleGateway.handle_subscription_updated", AsyncMock(return_value=None))
    monkeypatch.setattr("src.billing.service.PaddleGateway.user_subscribe", AsyncMock(return_value=updated_sub))
    monkeypatch.setattr("src.billing.service.PaddleGateway.record_transaction_payment", AsyncMock())
    sub_repo = AsyncMock()
    sub_repo.get_by_provider_subscription_id = AsyncMock(return_value=updated_sub)
    request = _dummy_request(raw)
    service = SubscriptionService(sub_repo, Mock(), Mock(), Mock())
    result = await service.paddle_webhook(request, "ts=1;h1=abc")
    assert result == {"ok": True}


async def test_paddle_webhook_transaction_failed(monkeypatch, mock_send_payment_failed_email_task):
    import json as _json
    payload = {"event_type": "transaction.payment_failed", "data": {"id": "txn_f", "subscription_id": "sub_999"}}
    raw = _json.dumps(payload).encode()
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", lambda *a, **k: None)
    failed_sub = SimpleNamespace(id=__import__("uuid").uuid4(), user_id=__import__("uuid").uuid4(),
        user=SimpleNamespace(email="f", username="u"), plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        current_period_end=__import__("datetime").datetime.now(__import__("datetime").timezone.utc))
    monkeypatch.setattr("src.billing.service.PaddleGateway.handle_transaction_failed", AsyncMock(return_value=failed_sub))
    request = _dummy_request(raw)
    service = SubscriptionService(Mock(), Mock(), Mock(), Mock())
    result = await service.paddle_webhook(request, "ts=1;h1=abc")
    assert result == {"ok": True}


async def test_paddle_webhook_transaction_failed_no_sub(monkeypatch, mock_send_payment_failed_email_task):
    import json as _json
    payload = {"event_type": "transaction.payment_failed", "data": {"id": "txn_f", "subscription_id": "sub_999"}}
    raw = _json.dumps(payload).encode()
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", lambda *a, **k: None)
    monkeypatch.setattr("src.billing.service.PaddleGateway.handle_transaction_failed", AsyncMock(return_value=None))
    request = _dummy_request(raw)
    service = SubscriptionService(Mock(), Mock(), Mock(), Mock())
    result = await service.paddle_webhook(request, "ts=1;h1=abc")
    assert result == {"ok": True}
    mock_send_payment_failed_email_task.assert_not_called()


async def test_paddle_webhook_subscription_canceled(monkeypatch, mock_send_cancel_subscription_email_task):
    import json as _json
    payload = {"event_type": "subscription.canceled", "data": {"id": "sub_123"}}
    raw = _json.dumps(payload).encode()
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", lambda *a, **k: None)
    canceled_sub = SimpleNamespace(id=__import__("uuid").uuid4(), user_id=__import__("uuid").uuid4(),
        user=SimpleNamespace(email="e", username="u"), plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        current_period_end=__import__("datetime").datetime.now(__import__("datetime").timezone.utc))
    monkeypatch.setattr("src.billing.service.PaddleGateway.handle_subscription_canceled", AsyncMock(return_value=canceled_sub))
    request = _dummy_request(raw)
    service = SubscriptionService(Mock(), Mock(), Mock(), Mock())
    result = await service.paddle_webhook(request, "ts=1;h1=abc")
    assert result == {"ok": True}


async def test_paddle_webhook_invalid_signature(monkeypatch):
    from fastapi import HTTPException as _HE
    def _raise(*a, **k):
        raise _HE(status_code=401, detail="Invalid Paddle signature")
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", _raise)
    request = _dummy_request(b"{}")
    service = SubscriptionService(Mock(), Mock(), Mock(), Mock())
    with pytest.raises(_HE) as exc:
        await service.paddle_webhook(request, "bad")

    assert exc.value.status_code == 401


async def test_payment_service_get_my_payments():
    user = SimpleNamespace(id=uuid4())
    repo = Mock()
    page = {
        "data": ["payment1", "payment2"], "total": 2, "limit": 50, "offset": 0,
        "has_next": False, "next_offset": None, "prev_offset": None,
    }
    repo.paginate_my_payments = AsyncMock(return_value=page)

    service = PaymentService(repo)
    result = await service.get_my_payments(user)

    assert result["data"] == ["payment1", "payment2"]
    repo.paginate_my_payments.assert_awaited_once_with(user.id, limit=50, offset=0)
