from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.billing.models import BillingPeriod, PaymentProvider, PaymentStatus, SubscriptionStatus


class PlanBase(BaseModel):
    name: str
    code: str
    price_cents: int
    billing_period: BillingPeriod
    currency: str = "USD"
    is_active: bool = True


class PlanCreate(PlanBase):
    paddle_product_id: str | None = None
    paddle_price_id: str | None = None


class PlanUpdate(BaseModel):
    name: str | None = None
    price_cents: int | None = None
    billing_period: BillingPeriod | None = None
    currency: str | None = None
    is_active: bool | None = None
    paddle_product_id: str | None = None
    paddle_price_id: str | None = None


class PlanOut(BaseModel):
    id: UUID
    name: str
    code: str
    price_cents: int
    currency: str
    billing_period: BillingPeriod
    tier: int = 0
    is_active: bool = True
    paddle_product_id: str | None = None
    paddle_price_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SubscriptionOut(BaseModel):
    id: UUID
    status: SubscriptionStatus  
    started_at: datetime 
    cancel_at_period_end: bool 
    current_period_end: datetime | None
    provider: PaymentProvider
    provider_subscription_id: str
    plan: PlanOut
    
    
    model_config = ConfigDict(from_attributes=True)


class SubscribeRequest(BaseModel):
    plan_code: str


class CheckoutUrlResponse(BaseModel):
    checkout_url: str
    transaction_id: str | None = None
    paddle_price_id: str | None = None
    activated_locally: bool | None = None
    updated_in_place: bool | None = None
    subscription_id: str | None = None


class PaymentResponse(BaseModel):
    id: UUID
    subscription_id: UUID | None = None
    provider: PaymentProvider
    provider_invoice_id: str
    amount_cents: int
    currency: str
    status: PaymentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedPlansOut(BaseModel):
    data: list[PlanOut]
    total: int
    limit: int
    offset: int
    has_next: bool
    next_offset: int | None = None
    prev_offset: int | None = None


class PaginatedPaymentsOut(BaseModel):
    data: list[PaymentResponse]
    total: int
    limit: int
    offset: int
    has_next: bool
    next_offset: int | None = None
    prev_offset: int | None = None