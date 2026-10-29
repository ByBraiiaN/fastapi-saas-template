import logging
import os
import sys

from loguru import logger

# Read from environment (with defaults). Prefers centralized settings when available.
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")          # INFO in prod, DEBUG in dev
APP_ENV = os.getenv("APP_ENV", "local")             # "local" | "production" | "staging"
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "true").lower() == "true"


class InterceptHandler(logging.Handler):
    """Redirect standard logging (uvicorn, libraries) to loguru."""
    def emit(self, record: logging.LogRecord) -> None:
        level: str | int
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back  # type: ignore
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level,
            record.getMessage(),
        )


def setup_logging() -> None:
    """Configure loguru for local dev + production."""
    logger.remove()

    # Always provide a domain so the log format never raises KeyError.
    logger.configure(extra={"domain": "app"})

    # 1) Console sink
    if APP_ENV == "local":
        # Pretty logs for local dev
        logger.add(
            sys.stdout,
            level=LOG_LEVEL,
            backtrace=True,
            diagnose=True,
            enqueue=True,
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                "<level>{level}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                "<yellow>{extra[domain]}</yellow> - "
                "<level>{message}</level>"
            ),
        )
    else:
        # JSON logs for production/staging
        logger.add(
            sys.stdout,
            level=LOG_LEVEL,
            backtrace=False,
            diagnose=False,
            enqueue=True,
            serialize=True,
        )

    # 2) General app file (opt-out with LOG_TO_FILE=false, e.g. tests/CI)
    if LOG_TO_FILE:
        logger.add(
            "logs/app.log",
            rotation="10 MB",
            retention="7 days",
            level=LOG_LEVEL,
            encoding="utf-8",
            enqueue=True,
        )

        # 3) Errors-only file (optional but useful)
        logger.add(
            "logs/errors.log",
            rotation="10 MB",
            retention="30 days",
            level="ERROR",
            encoding="utf-8",
            enqueue=True,
        )

        logger.add(
            "logs/auth.log",
            rotation="10 MB",
            retention="7 days",
            level=LOG_LEVEL,
            encoding="utf-8",
            enqueue=True,
            filter=lambda record: record["extra"].get("domain") == "auth",
        )

        # 4) (Optional) billing-only file based on `domain`
        logger.add(
            "logs/billing.log",
            rotation="10 MB",
            retention="7 days",
            level=LOG_LEVEL,
            encoding="utf-8",
            enqueue=True,
            filter=lambda record: record["extra"].get("domain") == "billing",
        )

    # 5) Redirect std logging → loguru
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logging.getLogger(name).handlers = [InterceptHandler()]
        logging.getLogger(name).propagate = False


def get_logger(domain: str | None = None):
    """
    Small helper so you can do:
        logger = get_logger("billing")
        logger.info("...")
    """
    return logger.bind(domain=domain) if domain else logger
