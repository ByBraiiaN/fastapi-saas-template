#!/usr/bin/env python3
"""Seed default plans (idempotent). Run after `alembic upgrade head`.

Usage (local):  python3 backend/scripts/seed_plans.py  (cwd = repo root or backend/)
Usage (docker): docker compose run --rm api python scripts/seed_plans.py
"""
import asyncio
import os
import sys

# Allow both repo-root and backend/ as cwd
_HERE = os.path.dirname(os.path.abspath(__file__))  # backend/scripts
_BACKEND = os.path.dirname(_HERE)  # backend/
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)
_REPO_ROOT = os.path.dirname(_BACKEND)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)
# Compatibility: allow running from the repository root or backend/
sys.path.insert(0, os.path.join(_REPO_ROOT, "backend"))

import src.load_models  # noqa: E402,F401  (registers models for relationship("User"))
from sqlalchemy import select  # noqa: E402
from src.billing.models import BillingPeriod, Plan, PlanTier  # noqa: E402
from src.database import async_session  # noqa: E402

DEFAULTS = [
    {"name": "Free", "code": "free", "price_cents": 0, "billing_period": BillingPeriod.MONTHLY, "currency": "USD", "tier": PlanTier.FREE},
    {"name": "Pro", "code": "pro", "price_cents": 1900, "billing_period": BillingPeriod.MONTHLY, "currency": "USD", "tier": PlanTier.PRO},
    {"name": "VIP", "code": "vip", "price_cents": 4900, "billing_period": BillingPeriod.MONTHLY, "currency": "USD", "tier": PlanTier.VIP},
]


async def main():
    async with async_session() as db:
        for p in DEFAULTS:
            exists = (await db.execute(select(Plan).where(Plan.code == p["code"]))).scalar_one_or_none()
            if exists:
                print(f"skip {p['code']}")
                continue
            db.add(Plan(**p))
        await db.commit()
    print("seed plans ok")


if __name__ == "__main__":
    asyncio.run(main())
