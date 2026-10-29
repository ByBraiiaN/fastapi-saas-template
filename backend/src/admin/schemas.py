from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.auth.models import Provider
from src.billing.models import PaymentProvider, PaymentStatus, SubscriptionStatus


class UpdateUserStatusIn(BaseModel):
    is_active: bool

class UpdateUserRoleIn(BaseModel):
    is_admin: bool


class AdminUserOut(BaseModel):
    """User projection for admin endpoints — never exposes password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    username: str
    is_admin: bool
    is_active: bool
    is_verified: bool
    provider: Provider
    paddle_customer_id: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminUserDetailOut(BaseModel):
    user: AdminUserOut
    subscriptions_count: int
    transactions_count: int


class PaginatedUsersOut(BaseModel):
    data: list[AdminUserOut]
    total: int
    limit: int
    offset: int
    has_next: bool
    next_offset: int | None = None
    prev_offset: int | None = None


class AdminStatsOut(BaseModel):
    users: int
    subscriptions: int
    payments: int


class AdminAuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    admin_id: UUID
    target_type: str
    target_id: UUID
    action: str
    before: dict | None = None
    after: dict | None = None
    created_at: datetime


class PaginatedAuditLogsOut(BaseModel):
    data: list[AdminAuditLogOut]
    total: int
    limit: int
    offset: int
    has_next: bool
    next_offset: int | None = None
    prev_offset: int | None = None


class AiChatResponse(BaseModel):
    response: str | None = None


class AdminSubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    plan_id: UUID
    status: SubscriptionStatus
    provider: PaymentProvider
    provider_subscription_id: str | None = None
    provider_customer_id: str | None = None
    started_at: datetime
    current_period_end: datetime | None = None
    cancel_at_period_end: bool
    canceled_at: datetime | None = None


class AdminPaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    subscription_id: UUID | None = None
    provider: PaymentProvider
    provider_invoice_id: str
    amount_cents: int
    currency: str
    status: PaymentStatus
    created_at: datetime


class PaginatedAdminSubscriptionsOut(BaseModel):
    data: list[AdminSubscriptionOut]
    total: int
    limit: int
    offset: int
    has_next: bool
    next_offset: int | None = None
    prev_offset: int | None = None


class PaginatedAdminPaymentsOut(BaseModel):
    data: list[AdminPaymentOut]
    total: int
    limit: int
    offset: int
    has_next: bool
    next_offset: int | None = None
    prev_offset: int | None = None
