from pydantic_settings import BaseSettings


class CelerySettings(BaseSettings):
    celery_worker_url: str = "redis://localhost:6379/0"
    celery_beat_url: str = "redis://localhost:6379/1"