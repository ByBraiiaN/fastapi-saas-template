from celery import Celery
from celery.schedules import crontab

from src.config import settings

celery_app = Celery(
    "worker",
    broker=settings.celery_worker_url,
    backend=None,
    include=["src.billing.tasks"],
)

# Single beat schedule on the same app (run beat with `celery -A src.celery_app.celery_app beat`)
celery_app.conf.task_routes = {
    "src.billing.tasks.*": {"queue": "billing"},
}


celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

celery_app.conf.beat_schedule = {
    "expire-subscriptions-every-hour": {
        "task": "src.billing.tasks.expire_subscriptions_task",
        "schedule": crontab(minute=0, hour="*"),
    },
}

# Backwards-compat alias: `celery -A src.celery_app.beat_app beat` still works
beat_app = celery_app
