# conftest.py — isolated async tests with per-test transactions
import os

os.environ.setdefault("LOG_TO_FILE", "false")
os.environ.setdefault("SQL_ECHO", "false")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from src.config import settings
from src.database import get_db
from src.main import app

# DB setup — requires TEST_DATABASE_URL (see .env.example / scripts/setup.sh)
test_engine = create_async_engine(settings.test_database_url, poolclass=NullPool)
TestSessionDB = sessionmaker(bind=test_engine, class_=AsyncSession, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True, loop_scope="session")
async def init_db():
    # Import all models so metadata is complete
    import src.load_models  # noqa: F401
    from src.database import Base
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture()
async def db_session(init_db):
    """Per-test isolated session with rollback + table cleanup for auth/billing."""
    async with TestSessionDB() as session:
        yield session
        # Rollback any pending tx
        await session.rollback()


@pytest.fixture(autouse=True)
async def clean_tables(init_db):
    """Ensure test isolation even when tests use TestSessionDB directly."""
    yield
    # Best-effort cleanup of mutable tables (keeps users/plans for speed,
    # but tests should use unique emails/codes — see plan_payload/auth fixtures).
    try:
        async with TestSessionDB() as session:
            from src.admin.models import AdminAuditLog
            from src.auth.models import LoginCode
            from src.billing.models import Payment, Subscription
            from src.models import RefreshToken
            await session.execute(delete(Payment))
            await session.execute(delete(Subscription))
            await session.execute(delete(AdminAuditLog))
            await session.execute(delete(LoginCode))
            await session.execute(delete(RefreshToken))
            await session.commit()
    except Exception:
        pass


@pytest.fixture()
async def client(db_session):
    async def _get_test_db():
        yield db_session  # FastAPI routes get the same session

    app.dependency_overrides[get_db] = _get_test_db

    # Real bypass for SlowAPI: remove middleware effect by disabling limiter
    # slowapi honours `limiter.enabled = False` only when set on the Limiter object
    # before middleware check; we also reset after.
    from src.rate_limiter import limiter
    _prev = getattr(limiter, "enabled", True)
    try:
        limiter.enabled = False  # type: ignore[attr-defined]
    except Exception:
        pass

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()
    try:
        limiter.enabled = _prev  # type: ignore[attr-defined]
    except Exception:
        pass


@pytest.fixture(autouse=True)
def mock_outbound(monkeypatch):
    """Global mocks: no real SMTP / Paddle / Celery broker in tests."""
    from unittest.mock import AsyncMock, MagicMock

    # Emails — avoid asyncio.run() inside BackgroundTasks + real SMTP
    for path in [
        "src.auth.emails.Emails.send_verification_email",
        "src.auth.emails.Emails.send_password_reset_email",
        "src.auth.emails.Emails.send_login_code",
    ]:
        try:
            monkeypatch.setattr(path, AsyncMock(return_value=None))
        except Exception:
            pass

    # Paddle gateway — no network
    try:
        import src.billing.service as _svc

        async def _fake_save(plan):
            plan.paddle_product_id = plan.paddle_product_id or "pro_test"
            plan.paddle_price_id = plan.paddle_price_id or "pri_test"
            return plan

        monkeypatch.setattr(_svc.PaddleGateway, "save_plan_to_paddle", AsyncMock(side_effect=_fake_save))
        monkeypatch.setattr(
            _svc.PaddleGateway, "create_subscription_checkout_session",
            AsyncMock(return_value={"checkout_url": "https://sandbox-paddle.test/checkout?txn=txn_test",
                                   "transaction_id": "txn_test", "paddle_price_id": "pri_test"})
        )
        for task_name in [
            "send_subscription_email_task",
            "send_update_subscription_email_task",
            "send_cancel_subscription_email_task",
            "send_payment_failed_email_task",
        ]:
            try:
                monkeypatch.setattr(_svc, task_name, MagicMock(delay=MagicMock()))
            except Exception:
                pass
    except Exception:
        pass
