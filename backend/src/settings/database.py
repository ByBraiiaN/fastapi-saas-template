from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app_db"
    sync_database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/app_db"
    test_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app_test_db"