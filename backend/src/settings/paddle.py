from typing import Literal

from pydantic_settings import BaseSettings


class PaddleSettings(BaseSettings):
    """Paddle Billing (MoR). Sandbox by default; prod via env."""

    paddle_api_key: str = ""
    paddle_webhook_secret: str = ""
    paddle_env: Literal["sandbox", "production"] = "sandbox"
    paddle_client_token: str = ""  # only needed for Paddle.js overlay (future)
    frontend_url: str = "http://localhost:3010"
