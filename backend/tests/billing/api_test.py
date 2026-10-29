import json
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import status
from httpx import AsyncClient
from src.billing.utils import serialize_subscription


@pytest.mark.asyncio
async def test_list_plans(client: AsyncClient, test_plan):
    response = await client.get("/billing/plans")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data["data"], list)
    assert any(plan["id"] == str(test_plan.id) for plan in data["data"])


@pytest.mark.asyncio
async def test_create_plan(client: AsyncClient, admin_headers, plan_payload):
    response = await client.post("/billing/plans", json=plan_payload, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == plan_payload["name"]
    assert data["code"] == plan_payload["code"]
    assert "price_cents" in data
    assert "currency" in data


@pytest.mark.asyncio
async def test_create_plan_exisiting_code(client: AsyncClient, admin_headers, test_plan):
    payload = {
        "name": "duplicate plan",
        "code": test_plan.code,
        "price_cents": 0,
        "billing_period": "monthly",
        "currency": "USD",
        "is_active": True
    }

    response = await client.post("/billing/plans", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Existing Code"


@pytest.mark.asyncio
async def test_create_plan_not_admin(client: AsyncClient, user_headers, plan_payload):
    response = await client.post("/billing/plans", json=plan_payload, headers=user_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "User does not have admin privileges"


@pytest.mark.asyncio
async def test_retrive_non_existing_plan(client: AsyncClient):
    non_existing_id = str(uuid4())  # valid UUID, but not in DB
    response = await client.get(f"/billing/plans/{non_existing_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "No plan found for this id"


@pytest.mark.asyncio
async def test_get_plan_by_id(client: AsyncClient, test_plan):
    response = await client.get(f"/billing/plans/{test_plan.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["id"] == str(test_plan.id)
    assert data["name"] == test_plan.name
    assert data["code"] == test_plan.code


@pytest.mark.asyncio
async def test_update_plan(client: AsyncClient, admin_headers, test_plan):
    payload = {
        "name": "updated",
        "price_cents": 999,
        "billing_period": "yearly",
        "currency": "USD",
        "is_active": False
    }

    response = await client.patch(
        f"/billing/plans/{test_plan.id}",
        json=payload,
        headers=admin_headers
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "updated"
    assert data["price_cents"] == 999
    assert data["billing_period"] == "yearly"
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_update_plan_not_admin(client: AsyncClient, user_headers, test_plan):
    payload = {"name": "hack-change"}

    response = await client.patch(
        f"/billing/plans/{test_plan.id}",
        json=payload,
        headers=user_headers
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "User does not have admin privileges"


@pytest.mark.asyncio
async def test_delete_plan(client: AsyncClient, admin_headers, test_plan):
    response = await client.delete(f"/billing/plans/{test_plan.id}", headers=admin_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    list_response = await client.get("/billing/plans")
    assert all(plan["id"] != str(test_plan.id) for plan in list_response.json()["data"])


@pytest.mark.asyncio
async def test_delete_plan_not_admin(client: AsyncClient, user_headers, test_plan):
    response = await client.delete(f"/billing/plans/{test_plan.id}", headers=user_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "User does not have admin privileges"


@pytest.mark.asyncio
async def test_get_my_subscription_none(client: AsyncClient, user_headers):
    response = await client.get("/billing/subscriptions/me", headers=user_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() is None


@pytest.mark.asyncio
async def test_get_my_subscription(
    client: AsyncClient, user_headers, test_subscription
):
    response = await client.get("/billing/subscriptions/me", headers=user_headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(test_subscription.id)
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_cancel_subscription(
    client: AsyncClient, user_headers, test_subscription
):
    response = await client.post("/billing/subscriptions/cancel", headers=user_headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["cancel_at_period_end"] is True
    assert data["status"] == "canceled"


@pytest.mark.asyncio
async def test_subscribe_to_plan_starts_checkout(client: AsyncClient, logged_in_user_no_subscription, test_plan, mock_create_checkout):
    headers = {"Authorization": f"Bearer {logged_in_user_no_subscription['token']}"}
    response = await client.post(
        "/billing/subscriptions/subscribe",
        json={"plan_code": test_plan.code},
        headers=headers,
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["checkout_url"] == "https://sandbox-paddle.test/checkout?txn=txn_test"
    assert data["transaction_id"] == "txn_test"
    mock_create_checkout.assert_awaited_once()


def _bypass_paddle_sig(monkeypatch):
    def _noop(*a, **k):
        return None
    monkeypatch.setattr("src.billing.paddle_gateway.verify_paddle_signature", _noop)
    monkeypatch.setattr("src.billing.service.verify_paddle_signature", _noop)


@pytest.mark.asyncio
async def test_paddle_webhook_subscription_created(
    client: AsyncClient,
    user_headers,
    mock_user_subscribe,
    monkeypatch,
):
    _bypass_paddle_sig(monkeypatch)
    event_payload = {
        "event_type": "subscription.created",
        "data": {"id": "sub_123", "customer_id": "ctm_123",
                 "custom_data": {"user_id": str(uuid4()), "plan_id": str(uuid4())},
                 "status": "active"},
    }

    response = await client.post(
        "/billing/paddle/webhook",
        content=json.dumps(event_payload),
        headers={**user_headers, "Paddle-Signature": "ts=1;h1=abc"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"ok": True}


@pytest.mark.asyncio
async def test_paddle_webhook_transaction_completed(
    client: AsyncClient,
    user_headers,
    mock_send_update_subscription_email_task,
    monkeypatch,
):
    _bypass_paddle_sig(monkeypatch)
    txn = {
        "id": "txn_test_1",
        "subscription_id": "sub_123",
        "customer_id": "ctm_123",
        "details": {"totals": {"grand_total": {"amount": "5000", "currency_code": "USD"}}},
        "custom_data": {},
    }
    event_payload = {"event_type": "transaction.completed", "data": txn}

    updated_sub = SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
        user=SimpleNamespace(email="e", username="u"),
        plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=datetime.now(UTC),
        current_period_end=datetime.now(UTC) + timedelta(days=30),
    )
    handle_sub_mock = AsyncMock(return_value=updated_sub)
    monkeypatch.setattr(
        "src.billing.service.PaddleGateway.handle_subscription_updated",
        handle_sub_mock,
    )
    record_mock = AsyncMock()
    monkeypatch.setattr("src.billing.service.PaddleGateway.record_transaction_payment", record_mock)
    monkeypatch.setattr(
        "src.billing.service.SubscriptionRepoistory.get_by_provider_subscription_id",
        AsyncMock(return_value=updated_sub),
    )

    response = await client.post(
        "/billing/paddle/webhook",
        content=json.dumps(event_payload),
        headers={**user_headers, "Paddle-Signature": "ts=1;h1=abc"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"ok": True}


@pytest.mark.asyncio
async def test_paddle_webhook_transaction_failed(
    client: AsyncClient,
    user_headers,
    mock_send_payment_failed_email_task,
    monkeypatch,
):
    _bypass_paddle_sig(monkeypatch)
    txn = {"id": "txn_fail", "subscription_id": "sub_456"}
    event_payload = {"event_type": "transaction.payment_failed", "data": txn}

    failed_sub = SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
        user=SimpleNamespace(email="fail@test.com", username="user"),
        plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=datetime.now(UTC),
        current_period_end=datetime.now(UTC) + timedelta(days=30),
    )
    handler_mock = AsyncMock(return_value=failed_sub)
    monkeypatch.setattr(
        "src.billing.service.PaddleGateway.handle_transaction_failed",
        handler_mock,
    )

    response = await client.post(
        "/billing/paddle/webhook",
        content=json.dumps(event_payload),
        headers={**user_headers, "Paddle-Signature": "ts=1;h1=abc"},
    )

    assert response.status_code == status.HTTP_200_OK
    handler_mock.assert_awaited_once()
    mock_send_payment_failed_email_task.assert_called_once_with(serialize_subscription(failed_sub))


@pytest.mark.asyncio
async def test_paddle_webhook_subscription_canceled(
    client: AsyncClient,
    user_headers,
    mock_send_cancel_subscription_email_task,
    monkeypatch,
):
    _bypass_paddle_sig(monkeypatch)
    event_payload = {"event_type": "subscription.canceled", "data": {"id": "sub_789"}}

    canceled_sub = SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
        user=SimpleNamespace(email="cancel@test.com", username="user"),
        plan=SimpleNamespace(name="Plan", price_cents=5000),
        started_at=datetime.now(UTC),
        current_period_end=datetime.now(UTC),
    )
    handler_mock = AsyncMock(return_value=canceled_sub)
    monkeypatch.setattr(
        "src.billing.service.PaddleGateway.handle_subscription_canceled",
        handler_mock,
    )

    response = await client.post(
        "/billing/paddle/webhook",
        content=json.dumps(event_payload),
        headers={**user_headers, "Paddle-Signature": "ts=1;h1=abc"},
    )

    assert response.status_code == status.HTTP_200_OK
    handler_mock.assert_awaited_once()
    mock_send_cancel_subscription_email_task.assert_called_once_with(serialize_subscription(canceled_sub))


@pytest.mark.asyncio
async def test_upgrade_subscription_starts_checkout(
    client: AsyncClient,
    admin_headers,
    user_headers,
    test_subscription,
    plan_payload,
    mock_create_checkout,
):
    upgrade_payload = {**plan_payload, "code": f"upgrade-{uuid4().hex[:6]}", "name": "Upgrade Plan"}
    create_resp = await client.post("/billing/plans", json=upgrade_payload, headers=admin_headers)
    assert create_resp.status_code == status.HTTP_201_CREATED

    response = await client.post(
        "/billing/subscriptions/upgrade",
        json={"plan_code": upgrade_payload["code"]},
        headers=user_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["checkout_url"] == "https://sandbox-paddle.test/checkout?txn=txn_test"
    assert data["transaction_id"] == "txn_test"
    mock_create_checkout.assert_awaited()


@pytest.mark.asyncio
async def test_get_my_payments_success(client: AsyncClient, user_headers, test_payment):
    response = await client.get("/billing/payments/me", headers=user_headers)

    assert response.status_code == status.HTTP_200_OK
    payments = response.json()["data"]
    assert isinstance(payments, list)
    assert payments[0]["provider_invoice_id"] == test_payment.provider_invoice_id
    assert payments[0]["status"] == "succeeded"


@pytest.mark.asyncio
async def test_get_my_payments_not_found(client: AsyncClient, user_headers, clear_user_subscriptions, clear_user_payments):
    response = await client.get("/billing/payments/me", headers=user_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_admin_audit_logs_are_exposed(client: AsyncClient, admin_headers, plan_payload):
    create_response = await client.post("/billing/plans", json=plan_payload, headers=admin_headers)
    assert create_response.status_code == status.HTTP_201_CREATED

    response = await client.get("/admin/audit-logs", headers=admin_headers)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 1
    assert any(item["action"] == "plan.create" for item in data["data"])
