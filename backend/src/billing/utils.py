from datetime import UTC, datetime

from src.billing.models import Subscription


def serialize_subscription(subscription: Subscription) -> dict:
    """
    Converts a Subscription SQLAlchemy object into a JSON-serializable dict
    ready to be sent to Celery tasks.
    """
    return {
        "id": subscription.id,
        "user": {
            "email": subscription.user.email,
            "username": subscription.user.username
        },
        "plan": {
            "name": subscription.plan.name,
            "price_cents": subscription.plan.price_cents
        },
        "start_date": subscription.started_at.strftime("%Y-%m-%d"),
        "end_date": subscription.current_period_end.strftime("%Y-%m-%d") 
                    if subscription.current_period_end else None,
        "price": subscription.plan.price_cents / 100
    }


def subscription_has_access(subscription: Subscription) -> bool:
    now = datetime.now(UTC)

    if not subscription.current_period_end or subscription.current_period_end <= now:
        return False
    
    return True
