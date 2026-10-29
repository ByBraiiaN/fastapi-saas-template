#!/usr/bin/env python3
"""Seed default admin user (idempotent). Run after `alembic upgrade head`.

Env (all optional in dev, required-ish in prod):
  ADMIN_EMAIL     default: admin@example.com
  ADMIN_USERNAME  default: admin
  ADMIN_PASSWORD  default: ChangeMe123! (dev only; in production set a strong one)
  RESET_ADMIN_PASSWORD=1  -> if admin exists, reset its password to ADMIN_PASSWORD

Usage (local):  python3 backend/scripts/seed_admin.py
Usage (docker): docker compose run --rm api python scripts/seed_admin.py

Safe to re-run: never duplicates, never overwrites password unless RESET_ADMIN_PASSWORD=1.
If the user exists without admin flags, it promotes to admin + verified + active.
"""
import argparse
import asyncio
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))  # backend/scripts
_BACKEND = os.path.dirname(_HERE)  # backend/
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)
_REPO_ROOT = os.path.dirname(_BACKEND)
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)
sys.path.insert(0, os.path.join(_REPO_ROOT, "backend"))

import src.load_models  # noqa: E402,F401  (registers models for relationship("Subscription"))
from src.auth.models import Provider, User  # noqa: E402
from src.auth.repository import UserRepository  # noqa: E402
from src.database import async_session  # noqa: E402
from src.hashing import hash_password  # noqa: E402


def _env(name: str, default: str) -> str:
    v = os.getenv(name, default)
    return v.strip() if isinstance(v, str) else v


async def main(reset_password: bool = False):
    email = _env("ADMIN_EMAIL", "admin@example.com").lower()
    username = _env("ADMIN_USERNAME", "admin")
    password = _env("ADMIN_PASSWORD", "ChangeMe123!")
    if not email or not password:
        print("ADMIN_EMAIL and ADMIN_PASSWORD must be set (or accept dev defaults). Skip.")
        return 1

    async with async_session() as db:
        repo = UserRepository(db)
        user = await repo.get_by_email(email)
        if user:
            updates: dict = {}
            if not user.is_admin:
                updates["is_admin"] = True
            if not user.is_verified:
                updates["is_verified"] = True
            if not user.is_active:
                updates["is_active"] = True
            if reset_password:
                updates["password"] = await hash_password(password)
            if updates:
                user = await repo.update(user, **updates)
                print(f"admin promoted/updated: {email} -> {updates.keys()}")
            else:
                print(f"admin exists, skip: {email} (use RESET_ADMIN_PASSWORD=1 to rotate password)")
            return 0
        user = User(
            email=email,
            username=username,
            password=await hash_password(password),
            provider=Provider.LOCAL,
            is_admin=True,
            is_active=True,
            is_verified=True,
        )
        user = await repo.create(user)
        print(f"admin created: {email} (id={user.id})")
        if password == "ChangeMe123!":
            print("WARNING: using default dev password. Set ADMIN_PASSWORD env in production.")
        return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset-password", action="store_true",
                    default=os.getenv("RESET_ADMIN_PASSWORD", "") == "1")
    args = ap.parse_args()
    raise SystemExit(asyncio.run(main(reset_password=args.reset_password)))
