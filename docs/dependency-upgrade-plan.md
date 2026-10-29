# Dependency upgrade plan

This plan is intentionally **not executed yet**. It records the MCP/audit findings and the safe order to apply them in a separate change.

Audit date: 2026-10-28.

## Current findings

### Backend (`pip-audit -r backend/requirements/requirements.txt`)

| Package | Current | Fixed | Risk |
| --- | --- | --- | --- |
| `starlette` | 0.49.3 | 1.1.0 / 1.3.1 | Multiple PYSEC advisories; FastAPI must be upgraded with Starlette |
| `pydantic-settings` | 2.12.0 | 2.14.2 | CVE-2026-58203 |
| `python-jose` | 3.5.0 | no fixed release | Unmaintained, PYSEC-2026-4298; replace |
| `mako` | 1.3.10 | 1.3.12 | PYSEC-2026-2617 |
| `python-dotenv` | 1.2.1 | 1.2.2 | PYSEC-2026-2270 |
| `requests` | 2.32.5 | 2.33.0 | PYSEC-2026-2275 |
| `urllib3` | 2.5.0 | 2.8.0 | Multiple PYSEC advisories |
| `orjson` | 3.11.3 | 3.11.6 | PYSEC-2026-107 |
| `idna` | 3.11 | 3.15 | PYSEC-2026-215 |
| `pyasn1` | 0.6.1 | 0.6.4 | Multiple PYSEC advisories |

Unmaintained but without a direct advisory in this run:

- `passlib` 1.7.4 (last release 2017) — only used as an Argon2 wrapper; remove it.
- `fastapi-mail` 1.5.8 — no active maintainer; replace with `aiosmtplib` + Jinja2.
- `slowapi` 0.1.9 — low maintenance; keep temporarily, review alternatives.

### Frontend (`npm audit --omit=dev`)

| Package | Severity | Notes |
| --- | --- | --- |
| `next` | moderate | Inherits vulnerable PostCSS |
| `postcss` | high | XSS/arbitrary file read through crafted CSS source maps |
| `zod` | high | Memory exhaustion with oversized constrained collections |

The frontend already runs Next.js 15, React 19, Tailwind 4, Recharts 3 and Zustand 5.

### Runtime images

- Node 20 reached end of life in April 2026. Move `frontend/Dockerfile`, CI and `.nvmrc` to Node 22 LTS.
- PostgreSQL 16 and Redis 7 are supported but newer major versions are available; upgrade only with a migration and backup plan.

## Phase 1 — Backend security patches

1. Upgrade FastAPI and Starlette together to the latest compatible pair (Starlette 1.1+).
2. Bump `pydantic`, `pydantic-settings`, `mako`, `python-dotenv`, `requests`, `urllib3`, `orjson`, `idna`, `pyasn1` and `redis` to their fixed releases.
3. Re-run `pytest`, `ruff`, `mypy`, `alembic upgrade head` and `alembic check`.
4. Test `/readyz`, login/refresh, OAuth callbacks, Paddle checkout and webhook signature paths.

## Phase 2 — Replace abandoned libraries

1. Replace `python-jose` with `PyJWT` (or Authlib if JWKS/RS256 is planned).
   - Update `backend/src/jwt.py` and token tests.
   - Keep `HS256` for now; plan `RS256` with key rotation before production.
2. Remove `passlib`; call `argon2-cffi` directly in `backend/src/hashing.py` with `PasswordHasher`.
3. Replace `fastapi-mail` with `aiosmtplib` + Jinja2.
   - Reuse the existing templates in `backend/templates/email`.
   - Keep the async methods in `backend/src/auth/emails.py` and the Celery tasks unchanged.
4. Reinspect `slowapi`; if replaced, preserve per-route limits (login, register, OTP, password reset, refresh).

## Phase 3 — Frontend audit

1. Upgrade `postcss` and `zod` to fixed releases.
2. Verify Next.js includes the patched PostCSS; if not, pin a safe version with an override.
3. Run `npm audit --omit=dev`, `npm run typecheck`, `npm run lint`, `npm run build`.
4. Review the unusual `lucide-react` major range and confirm the package is the official one.

## Phase 4 — Runtime and CI

1. Move to Node 22 LTS in `frontend/Dockerfile`, `.github/workflows/ci.yml` and add `.nvmrc`.
2. Add `pip-audit` and `npm audit --audit-level=high` to CI (non-blocking at first, blocking once clean).
3. Build a production frontend image (`next build` + `next start` or standalone output), not `next dev`.
4. Add Dependabot or Renovate for `backend/requirements`, `frontend/package.json` and Docker images.

## Acceptance criteria

- [ ] `pip-audit` reports no high/critical advisories
- [ ] `npm audit --omit=dev` reports no high/critical advisories
- [ ] `pytest` passes
- [ ] `ruff check` and `mypy` pass
- [ ] `alembic upgrade head` and `alembic check` pass
- [ ] frontend `typecheck`, `lint` and `build` pass
- [ ] Paddle sandbox checkout and webhook signature tested
- [ ] no abandoned dependency remains in the production path
