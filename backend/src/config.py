from pathlib import Path

from pydantic import model_validator
from pydantic_settings import SettingsConfigDict

from src.admin.config import AiSettings
from src.auth.config import AuthSettings
from src.settings.app import AppSettings
from src.settings.celery import CelerySettings
from src.settings.database import DatabaseSettings
from src.settings.mail import MailSettings
from src.settings.paddle import PaddleSettings
from src.settings.redis import RedisSettings

BASE_DIR = Path(__file__).parent.parent


class Settings(AppSettings,DatabaseSettings,MailSettings,RedisSettings,
    CelerySettings,AuthSettings, PaddleSettings, AiSettings):

    model_config = SettingsConfigDict(env_file=".env",env_file_encoding="utf-8",
    extra="ignore",)

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.app_env != "production":
            return self

        secrets = {
            "ACCESS_SECRET_KEY": self.access_secret_key,
            "REFRESH_SECRET_KEY": self.refresh_secret_key,
            "VALIDATION_SECRET_KEY": self.validation_secret_key,
        }
        weak = [name for name, value in secrets.items() if len(value) < 32]
        if weak:
            raise ValueError(
                "Production requires 32+ character secrets: " + ", ".join(weak)
            )
        return self


settings = Settings()


