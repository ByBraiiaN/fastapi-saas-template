from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy import delete, select, update
from src.auth.models import Provider, User
from src.billing.models import (
    BillingPeriod,
    Payment,
    PaymentProvider,
    PaymentStatus,
    Plan,
    Subscription,
    SubscriptionStatus,
)
from src.hashing import hash_password

from tests.conftest import TestSessionDB


@pytest.fixture(autouse=True)
def mock_save_paddle_plan(monkeypatch):
    async def _save(plan):
        plan.paddle_product_id = plan.paddle_product_id or "pro_test"
        plan.paddle_price_id = plan.paddle_price_id or "pri_test"
        return plan
    mock = AsyncMock(side_effect=_save)
    monkeypatch.setattr("src.billing.service.PaddleGateway.save_plan_to_paddle", mock)
    return mock


@pytest.fixture(autouse=True)
def mock_create_checkout(monkeypatch):
    mock = AsyncMock(return_value={"checkout_url": "https://sandbox-paddle.test/checkout?txn=txn_test",
                                   "transaction_id": "txn_test", "paddle_price_id": "pri_test"})
    monkeypatch.setattr("src.billing.service.PaddleGateway.create_subscription_checkout_session", mock)
    return mock


@pytest.fixture(autouse=True)
def mock_paddle_sdk(monkeypatch):
    # Paddle-first: no product/price SDK calls in v1; keep hook for future
    return None


@pytest.fixture(autouse=True)
def mock_cancel_at_period_end(monkeypatch):
    async def _cancel(sub):
        return datetime.now(UTC), sub.current_period_end
    mock = AsyncMock(side_effect=_cancel)
    monkeypatch.setattr("src.billing.service.PaddleGateway.cancel_subscription_at_period_end", mock)
    return mock


@pytest.fixture(autouse=True)
def mock_send_subscription_email_task(monkeypatch):
    """Stub Celery task to avoid hitting a broker and allow assertions."""
    delay_mock = MagicMock()
    task_mock = MagicMock(delay=delay_mock)
    monkeypatch.setattr("src.billing.service.send_subscription_email_task", task_mock)
    return delay_mock


@pytest.fixture(autouse=True)
def mock_send_update_subscription_email_task(monkeypatch):
    delay_mock = MagicMock()
    task_mock = MagicMock(delay=delay_mock)
    monkeypatch.setattr("src.billing.service.send_update_subscription_email_task", task_mock)
    return delay_mock


@pytest.fixture(autouse=True)
def mock_send_cancel_subscription_email_task(monkeypatch):
    delay_mock = MagicMock()
    task_mock = MagicMock(delay=delay_mock)
    monkeypatch.setattr("src.billing.service.send_cancel_subscription_email_task", task_mock)
    return delay_mock


@pytest.fixture(autouse=True)
def mock_send_payment_failed_email_task(monkeypatch):
    delay_mock = MagicMock()
    task_mock = MagicMock(delay=delay_mock)
    monkeypatch.setattr("src.billing.service.send_payment_failed_email_task", task_mock)
    return delay_mock


@pytest.fixture()
async def fake_subscription(normal_user, test_plan):
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=uuid4(),
        user_id=normal_user.id,
        user=normal_user,
        plan=test_plan,
        plan_id=test_plan.id,
        started_at=now,
        current_period_end=now + timedelta(days=30),
        cancel_at_period_end=False,
        provider=PaymentProvider.PADDLE,
        provider_subscription_id="sub_test",
        provider_customer_id="cus_test",
    )


@pytest.fixture()
async def mock_user_subscribe(monkeypatch, fake_subscription):
    mock = AsyncMock(return_value=fake_subscription)
    monkeypatch.setattr("src.billing.service.PaddleGateway.user_subscribe", mock)
    return mock


@pytest.fixture()
async def admin_user():
    async with TestSessionDB() as session:
        result = await session.execute(
            select(User).where(User.email == "admin@test.com")
        )
        user = result.scalar_one_or_none()
        if user:
            return user

        hashed = await hash_password("123456")

        user = User(
            id=uuid4(),
            email="admin@test.com",
            username="admin_user",
            password=hashed,
            is_active=True,
            is_verified=True,
            is_admin=True,
            provider=Provider.LOCAL,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.fixture()
async def normal_user():
    async with TestSessionDB() as session:
        result = await session.execute(
            select(User).where(User.email == "normal@test.com")
        )
        user = result.scalar_one_or_none()
        if user:
            return user

        hashed = await hash_password("123456")

        user = User(
            id=uuid4(),
            email="normal@test.com",
            username="normal",
            password=hashed,
            is_active=True,
            is_verified=True,
            provider=Provider.LOCAL,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.fixture
async def logged_in_admin(client, admin_user):
    response = await client.post("/login", json={
        "email": admin_user.email,
        "password": "123456"
    })
    assert response.status_code == 200
    token = response.json()["token"]
    refresh_token = response.cookies.get("refresh_token")

    return {"user": admin_user, "token": token, "refresh_token": refresh_token}


@pytest.fixture
async def logged_in_user(client, normal_user):
    response = await client.post("/login", json={
        "email": normal_user.email,
        "password": "123456"
    })
    assert response.status_code == 200
    token = response.json()["token"]
    refresh_token = response.cookies.get("refresh_token")

    return {"user": normal_user, "token": token, "refresh_token": refresh_token}


@pytest.fixture
async def admin_headers(logged_in_admin):
    return {"Authorization": f"Bearer {logged_in_admin['token']}"}


@pytest.fixture
async def user_headers(logged_in_user):
    return {"Authorization": f"Bearer {logged_in_user['token']}"}


@pytest.fixture
def plan_payload():
    return {
        "name": "test plan",
        "code": f"test-{uuid4().hex[:6]}",
        "price_cents": 0,
        "billing_period": "monthly",
        "currency": "USD",
        "is_active": True
    }


@pytest.fixture
async def test_plan():
    async with TestSessionDB() as session:
        result = await session.execute(select(Plan).where(Plan.code == "test-plan"))
        plan = result.scalar_one_or_none()

        if plan:
            if not plan.is_active:
                await session.execute(
                    update(Plan).where(Plan.id == plan.id).values(is_active=True)
                )
                await session.commit()
                await session.refresh(plan)
            return plan

        plan = Plan(
            id=uuid4(),
            name="Test Plan",
            code="test-plan",
            price_cents=1000,
            billing_period=BillingPeriod.MONTHLY,
            currency="USD",
            is_active=True,
            paddle_price_id="pri_test",
            paddle_product_id="pro_test",
        )
        session.add(plan)
        await session.commit()
        await session.refresh(plan)
        return plan


@pytest.fixture
async def test_subscription(normal_user, test_plan):
    async with TestSessionDB() as session:
        result = await session.execute(
            select(Subscription).where(
                Subscription.user_id == normal_user.id,
                Subscription.plan_id == test_plan.id
            )
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            update_values = {
                "status": SubscriptionStatus.ACTIVE,
                "cancel_at_period_end": False,
                "current_period_end": datetime.now(UTC) + timedelta(days=30),
                "provider": PaymentProvider.PADDLE,
                "provider_subscription_id": subscription.provider_subscription_id or "sub_test",
                "provider_customer_id": subscription.provider_customer_id or "cus_test",
            }
            await session.execute(
                update(Subscription)
                .where(Subscription.id == subscription.id)
                .values(**update_values)
            )
            await session.commit()
            await session.refresh(subscription)
            return subscription

        subscription = Subscription(
            id=uuid4(),
            user_id=normal_user.id,
            plan_id=test_plan.id,
            status=SubscriptionStatus.ACTIVE,
            cancel_at_period_end=False,
            provider=PaymentProvider.PADDLE,
            provider_subscription_id="sub_test",
            provider_customer_id="cus_test",
            current_period_end=datetime.now(UTC) + timedelta(days=30),
        )
        session.add(subscription)
        await session.commit()
        await session.refresh(subscription)
        return subscription


@pytest.fixture()
async def test_payment(normal_user, test_subscription):
    async with TestSessionDB() as session:
        result = await session.execute(
            select(Payment).where(Payment.user_id == normal_user.id)
        )
        payment = result.scalar_one_or_none()
        if payment:
            return payment

        payment = Payment(
            id=uuid4(),
            user_id=normal_user.id,
            subscription_id=test_subscription.id,
            provider=PaymentProvider.PADDLE,
            provider_invoice_id="inv_test",
            amount_cents=5000,
            currency="USD",
            status=PaymentStatus.SUCCEEDED,
        )
        session.add(payment)
        await session.commit()
        await session.refresh(payment)
        return payment


@pytest.fixture()
async def clear_user_subscriptions(normal_user):
    async with TestSessionDB() as session:
        await session.execute(
            delete(Subscription).where(Subscription.user_id == normal_user.id)
        )
        await session.commit()
    return normal_user


@pytest.fixture()
async def clear_user_payments(normal_user):
    async with TestSessionDB() as session:
        await session.execute(delete(Payment).where(Payment.user_id == normal_user.id))
        await session.commit()
    return normal_user


@pytest.fixture()
async def logged_in_user_no_subscription(client, clear_user_subscriptions):
    response = await client.post("/login", json={
        "email": clear_user_subscriptions.email,
        "password": "123456"
    })
    assert response.status_code == 200
    token = response.json()["token"]
    refresh_token = response.cookies.get("refresh_token")

    return {"user": clear_user_subscriptions, "token": token, "refresh_token": refresh_token}
