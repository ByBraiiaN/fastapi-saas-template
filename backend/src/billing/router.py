from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status

from src.admin.dependencies import AuditLogsServiceDep
from src.auth_bearer import active_user_dep, admin_required
from src.billing import schemas
from src.billing.dependencies import PaymentServiceDep, PlanServiceDep, SubscriptionServiceDep
from src.rate_limiter import limiter

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=schemas.PaginatedPlansOut, status_code=status.HTTP_200_OK)
async def list_plans(PlanService: PlanServiceDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)):
    return await PlanService.retrive_plans(limit=limit, offset=offset)


@router.post("/plans", response_model=schemas.PlanOut, status_code=status.HTTP_201_CREATED)
async def create_plan(admin_user: admin_required, data: schemas.PlanCreate, PlanService: PlanServiceDep,
                       audit: AuditLogsServiceDep):
    result = await PlanService.create_plan(data)
    if result:
        await audit.log(admin_id=admin_user.id, target_type="plan", target_id=result.id,
                        action="plan.create", after={"code": result.code, "name": result.name})
        return result


@router.get("/plans/{plan_id}", response_model=schemas.PlanOut, status_code=status.HTTP_200_OK)
async def get_plan(plan_id: UUID, PlanService: PlanServiceDep):
    plan = await PlanService.get_plan_by_id(plan_id)
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(admin_user: admin_required, plan_id: UUID, PlanService: PlanServiceDep,
                      audit: AuditLogsServiceDep):
    await PlanService.soft_delete_plan(plan_id)
    await audit.log(admin_id=admin_user.id, target_type="plan", target_id=plan_id,
                    action="plan.delete", before={"plan_id": str(plan_id)})


@router.patch("/plans/{plan_id}", response_model=schemas.PlanOut, status_code=status.HTTP_200_OK)
async def update_plan(admin_user: admin_required, plan_id: UUID, data: schemas.PlanUpdate,
                      PlanService: PlanServiceDep, audit: AuditLogsServiceDep):
    result = await PlanService.update_plan(plan_id, data)
    await audit.log(admin_id=admin_user.id, target_type="plan", target_id=plan_id,
                    action="plan.update", after=data.model_dump(exclude_unset=True))
    return result



@router.get("/payments/me", response_model=schemas.PaginatedPaymentsOut, status_code=status.HTTP_200_OK)
async def get_my_payments(user: active_user_dep, PaymentService: PaymentServiceDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)):
    return await PaymentService.get_my_payments(user, limit=limit, offset=offset)


@router.get("/subscriptions/me", response_model=schemas.SubscriptionOut | None, status_code=status.HTTP_200_OK)
async def get_my_subscription(user: active_user_dep, SubscriptionService: SubscriptionServiceDep):
    subscription = await SubscriptionService.get_user_subscription(user.id)
    return subscription


@router.post("/subscriptions/subscribe", response_model=schemas.CheckoutUrlResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_to_plan(user: active_user_dep, data: schemas.SubscribeRequest,SubscriptionService: SubscriptionServiceDep):
    result = await SubscriptionService.subscribe_user_to_plan(user, data.plan_code)
    if isinstance(result, dict):
        return result
    return {"checkout_url": result}


@router.post("/subscriptions/cancel", response_model=schemas.SubscriptionOut, status_code=status.HTTP_200_OK)
async def cancel_subscription_at_end_of_period(user: active_user_dep, SubscriptionService: SubscriptionServiceDep):
    subscription = await SubscriptionService.cancel_subscription_at_end_of_period(user.id)
    return subscription


@router.post("/subscriptions/upgrade", response_model=schemas.CheckoutUrlResponse, status_code=status.HTTP_200_OK)
async def upgrade_subscription(data: schemas.SubscribeRequest, user: active_user_dep, SubscriptionService: SubscriptionServiceDep):
    result = await SubscriptionService.upgrade_subscription(user, data.plan_code)
    if isinstance(result, dict):
        return result
    return {"checkout_url": result}


@router.post("/paddle/webhook")
@limiter.exempt
async def paddle_webhook(request: Request, SubscriptionService: SubscriptionServiceDep):
    paddle_signature = request.headers.get("Paddle-Signature", "")
    result = await SubscriptionService.paddle_webhook(request, paddle_signature)
    return result or {"ok": True}


@router.post("/stripe/webhook", deprecated=True, include_in_schema=False)
@limiter.exempt
async def stripe_webhook_retired(request: Request, SubscriptionService: SubscriptionServiceDep):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Stripe retired, use /billing/paddle/webhook")




