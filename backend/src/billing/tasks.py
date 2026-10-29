from datetime import UTC, datetime

from asgiref.sync import async_to_sync
from sqlalchemy import update

from src import load_models  # noqa: F401  (ensure models registered)
from src.billing.emails import Emails
from src.billing.models import Subscription, SubscriptionStatus
from src.celery_app import celery_app
from src.database import SyncSessionLocal
from src.logging import get_logger

logger = get_logger("billing")


email_service = Emails()

@celery_app.task(
            name="send_subscription_email_task",
            autoretry_for=(Exception,),
            retry_backoff=True,
            retry_kwargs={"max_retries": 5},
        )
def send_subscription_email_task(subscription: dict):
    async_to_sync(email_service.send_subscription_email)(subscription)


@celery_app.task(
        name="send_update_subscription_email_task",
        autoretry_for=(Exception,),
        retry_backoff=True,
        retry_kwargs={"max_retries": 5},
        )
def send_update_subscription_email_task(subscription: dict):
    async_to_sync(email_service.send_subscription_update_email)(subscription)


@celery_app.task(
        name="send_cancel_subscription_email_task",
        autoretry_for=(Exception,),
        retry_backoff=True,
        retry_kwargs={"max_retries": 5},
        )
def send_cancel_subscription_email_task(subscription: dict):
    async_to_sync(email_service.send_cancel_subscription_email)(subscription)


@celery_app.task(
        name="send_payment_failed_email_task",
        autoretry_for=(Exception,),
        retry_backoff=True,
        retry_kwargs={"max_retries": 5},
        )
def send_payment_failed_email_task(subscription: dict):
    async_to_sync(email_service.send_payment_failed_email)(subscription)

@celery_app.task(name="src.billing.tasks.expire_subscriptions_task")
def expire_subscriptions_task():
    """Expire subscriptions whose billing period has ended."""
    db = SyncSessionLocal()
    try:
        now = datetime.now(UTC)
        result = db.execute(
            update(Subscription)
            .where(Subscription.current_period_end <= now)
            .where(
                Subscription.status.in_(
                    [
                        SubscriptionStatus.ACTIVE,
                        SubscriptionStatus.TRIALING,
                        SubscriptionStatus.PAST_DUE,
                    ]
                )
            )
            .values(status=SubscriptionStatus.CANCELED, canceled_at=now)
        )
        db.commit()
        count = getattr(result, "rowcount", 0)
        logger.info(f"expire_subscriptions_task completed expired={count}")
        return count
    except Exception as e:
        db.rollback()
        logger.exception(f"expire_subscriptions_task failed: {e}")
        raise
    finally:
        db.close()

