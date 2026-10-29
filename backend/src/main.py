import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from src.admin.router import router as admin_router
from src.auth.router import router as auth_router
from src.billing.router import router as billing_router
from src.config import settings
from src.exceptions import validation_exception_handler
from src.logging import get_logger, setup_logging
from src.rate_limiter import limiter

setup_logging()
logger = get_logger("api")

OPENAPI_TAGS = [
    {"name": "ops", "description": "Health and readiness probes."},
    {"name": "auth", "description": "Registration, login, OAuth, OTP and password flows."},
    {"name": "billing", "description": "Paddle Billing plans, subscriptions and webhooks."},
    {"name": "admin", "description": "Admin-only metrics, users and billing management."},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API startup")
    yield
    logger.info("API shutdown")


_docs_enabled = settings.app_env != "production"

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="FastAPI SaaS template with Paddle Billing, auth and an admin panel.",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.state.limiter = limiter

app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    method = request.method
    path = request.url.path
    client_host = request.client.host if request.client else "unknown"
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]

    with logger.contextualize(domain="api", request_id=request_id):
        try:
            response = await call_next(request)
        except Exception as e:
            duration = (time.perf_counter() - start) * 1000
            logger.exception(
                f"{method} {path} from {client_host} -> CRASHED ({duration:.2f}ms): {e}"
            )
            raise

        duration = (time.perf_counter() - start) * 1000
        status = response.status_code
        response.headers["X-Request-ID"] = request_id

        if status < 400:
            logger.info(f"{method} {path} from {client_host} -> {status} ({duration:.2f}ms)")
        elif status < 500:
            logger.warning(f"{method} {path} from {client_host} -> {status} ({duration:.2f}ms)")
        else:
            logger.error(f"{method} {path} from {client_host} -> {status} ({duration:.2f}ms)")

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(
        origin for origin in [
            settings.frontend_url,
            "http://localhost:3010",
            "http://localhost:8080",
        ] if origin
    )),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
    max_age=600,
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

app.include_router(auth_router, tags=["auth"])
app.include_router(billing_router)
app.include_router(admin_router)


@app.get("/healthz", tags=["ops"])
async def healthz():
    return {"status": "ok"}


@app.get("/readyz", tags=["ops"])
async def readyz():
    # Lightweight readiness: import here to avoid circulars
    from sqlalchemy import text

    from src.database import engine
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logger.warning(f"readyz failed: {e}")
        return JSONResponse(status_code=503, content={"status": "not-ready"})
