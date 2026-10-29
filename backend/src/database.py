import os
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from src.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)


async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)




Base = declarative_base()


async def get_db():
    async with async_session() as session:
        yield session


db_dependency = Annotated[AsyncSession, Depends(get_db)]



# ---------------------------
# SYNC (Celery)
# ---------------------------
sync_engine = create_engine(
    settings.sync_database_url,
    future=True,
    echo=False,
    pool_pre_ping=True,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_sync_session():
    """Used ONLY inside Celery tasks."""
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()