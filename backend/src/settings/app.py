from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    app_name: str = "FastAPI SaaS Template"
    app_env: str = "development"
    app_debug: bool = True
    app_url: str = "http://localhost:8010"