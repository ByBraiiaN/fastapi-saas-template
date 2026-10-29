from uuid import UUID

from fastapi import APIRouter, Depends, Query

from src.admin import dependencies, schemas
from src.auth_bearer import admin_required, get_admin_user

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_admin_user)],
)



@router.get("/dashboard/stats", response_model=schemas.AdminStatsOut)
async def get_dashboard_stats(analytics_depenency: dependencies.AnalyiticsServiceDep,):
    stats = await analytics_depenency.get_stats()
    return stats
    


@router.get("/users", response_model=schemas.PaginatedUsersOut)
async def get_users(user_dependency: dependencies.UsersServiceDep,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    is_active: bool | None = Query(None),
    is_verified: bool | None = Query(None),
    is_admin: bool | None = Query(None)):

    users = await user_dependency.get_users(
        limit=limit,
        offset=offset,
        is_active=is_active,
        is_verified=is_verified,
        is_admin=is_admin
    )
    return users
    

@router.get("/users/{user_id}", response_model=schemas.AdminUserDetailOut)
async def get_user_details(user_dependency: dependencies.UsersServiceDep, user_id: UUID):
    user = await user_dependency.get_user_by_id(user_id)
    return user


@router.get("/users/{user_id}/transactions", response_model=schemas.PaginatedAdminPaymentsOut)
async def get_user_transactions(user_dependency: dependencies.UsersServiceDep, user_id: UUID,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),):
    transactions = await user_dependency.get_user_transactions(user_id, limit=limit, offset=offset)
    return transactions


@router.get("/users/{user_id}/subscriptions", response_model=schemas.PaginatedAdminSubscriptionsOut)
async def get_user_subscriptions(user_dependency: dependencies.UsersServiceDep, user_id: UUID,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),):
    subscriptions = await user_dependency.get_user_subscriptions(user_id, limit=limit, offset=offset)
    return subscriptions


@router.patch("/users/{user_id}/status", response_model=schemas.AdminUserOut)
async def update_user_status(admin: admin_required, user_dependency: dependencies.UsersServiceDep, user_id: UUID,
    data: schemas.UpdateUserStatusIn):
    updated_user = await user_dependency.update_user_status(admin.id, user_id, data.is_active)
    return updated_user


@router.patch("/users/{user_id}/role", response_model=schemas.AdminUserOut)
async def update_user_role(admin: admin_required, user_dependency: dependencies.UsersServiceDep, user_id: UUID,
    data: schemas.UpdateUserRoleIn):
    updated_user = await user_dependency.update_user_role(admin.id, user_id, data.is_admin)
    return updated_user


@router.patch("/users/{user_id}/verify", response_model=schemas.AdminUserOut)
async def verify_user(admin: admin_required, user_dependency: dependencies.UsersServiceDep, user_id: UUID):
    updated_user = await user_dependency.verify_user(admin.id, user_id)
    return updated_user


@router.get("/billing/transactions", response_model=schemas.PaginatedAdminPaymentsOut)
async def get_transactions(payment_dependency: dependencies.PaymentsServceDep,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),):
    payments = await payment_dependency.get_payments(limit=limit, offset=offset)
    return payments
    

@router.get("/billing/transactions/{payment_id}", response_model=schemas.AdminPaymentOut)
async def get_transaction_by_id(payment_dependency: dependencies.PaymentsServceDep,
    payment_id: UUID):
    payment = await payment_dependency.get_payment_by_id(payment_id)
    return payment


@router.get("/billing/subscriptions", response_model=schemas.PaginatedAdminSubscriptionsOut)
async def get_subscriptions(subscription_dependency: dependencies.SubScriptionsServciceDep,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),):
    subscriptions = await subscription_dependency.get_subscriptions(limit=limit, offset=offset)
    return subscriptions 


@router.get("/billing/subscriptions/{sub_id}", response_model=schemas.AdminSubscriptionOut)
async def get_subscription_by_id(subscription_dependency: dependencies.SubScriptionsServciceDep,
    sub_id: UUID):
    subscription = await subscription_dependency.get_subscription_by_id(sub_id)
    return subscription


@router.post("/ai/chat", response_model=schemas.AiChatResponse)
async def ai_chat(admin: admin_required, ai_service: dependencies.AiServiceDep,
                  audit_service: dependencies.AuditLogsServiceDep, prompt: str):
    response = await ai_service.call_ai_model(prompt)
    await audit_service.log(
        admin_id=admin.id,
        target_type="ai",
        target_id=admin.id,
        action="ai.chat",
        before={"prompt": prompt},
        after={"response": response},
    )
    return {"response": response}


@router.get("/audit-logs", response_model=schemas.PaginatedAuditLogsOut)
async def get_audit_logs(audit_service: dependencies.AuditLogsServiceDep,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin_id: UUID | None = Query(None),
    target_type: str | None = Query(None),
    target_id: UUID | None = Query(None),
    action: str | None = Query(None)):
    return await audit_service.list_audit_logs(
        admin_id=admin_id,
        target_type=target_type,
        target_id=target_id,
        action=action,
        limit=limit,
        offset=offset,
    )