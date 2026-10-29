# Deployment

This template ships with a development-oriented Docker Compose stack. Treat the checklist below as the minimum before exposing it to real users.

## Secrets

- Generate unique values for `ACCESS_SECRET_KEY`, `REFRESH_SECRET_KEY` and `VALIDATION_SECRET_KEY` (32+ characters). Production startup rejects shorter values.
- Change `ADMIN_PASSWORD`; run `seed_admin.py` with `RESET_ADMIN_PASSWORD=1` to rotate it.
- Set Paddle live keys and `PADDLE_ENV=production`.
- Use real SMTP credentials instead of Mailpit.
- Never commit `.env` or `backend/.env`.

## Application settings

```env
APP_ENV=production
APP_DEBUG=False
PADDLE_ENV=production
FRONTEND_URL=https://your-domain.example
NEXT_PUBLIC_API_URL=https://api.your-domain.example
```

- `APP_ENV=production` disables `/docs`, `/redoc` and `/openapi.json`, enforces the secret-length check, sets `Secure` cookies and emits JSON logs.
- Add your real frontend origin to `FRONTEND_URL`; CORS keeps development origins only for local work.
- Terminate TLS at your proxy/load balancer and forward `X-Forwarded-*` headers to Uvicorn.

## Database and Redis

- Use managed PostgreSQL and Redis, or restrict both to the private network.
- Run `alembic upgrade head` before starting the API. The Compose command already does this in development.
- Back up the database before the first production migration and regularly afterwards.
- Set `TEST_DATABASE_URL` to a separate database; never point tests at production.

## Paddle

- Create production products/prices and map them to local plans.
- Register the live webhook URL (`POST /billing/paddle/webhook`) under Notifications and store the signing secret.
- Keep the 30-second signature window and idempotency unique constraint.
- Test the complete flow in sandbox with test cards and the webhook simulator first.

## Containers

- Build deterministic images with `package-lock.json` (`npm ci`) and a production frontend build (`next build` + `next start`).
- The current `frontend/Dockerfile` runs the development server; create a multi-stage production image before deploying the web app.
- Serve the frontend and API on separate hostnames or behind one reverse proxy.
- Add health checks against `/readyz`.

## Observability

- Ship JSON logs from stdout to your log platform.
- Propagate `X-Request-ID` through the proxy so requests can be correlated.
- Monitor `/readyz`, Celery queue depth, failed webhook deliveries and 5xx rates.
- Configure alerts for payment failures and webhook signature errors.

## Security hardening

- Remove `refresh_token` from the JSON login response once all clients use the HttpOnly cookie.
- Consider `SameSite=None; Secure` only if the frontend and API are truly cross-site.
- Add CSRF protection if you move authentication fully to cookies.
- Add `TrustedHostMiddleware` and strict `allow_methods`/`allow_headers` for your domain.
- Review the AI admin assistant: keep SQL read-only, use a restricted database role and audit prompts.
- Consider moving JWT signing from `HS256` to `RS256` with key rotation.

## Release checklist

- [ ] Secrets rotated and stored in a secret manager
- [ ] `APP_ENV=production`, debug off, HTTPS enforced
- [ ] Real `FRONTEND_URL` and CORS verified
- [ ] Paddle live catalog and webhook configured
- [ ] `alembic upgrade head` applied
- [ ] Admin seeded and default password changed
- [ ] Backups configured and restore tested
- [ ] `/healthz` and `/readyz` monitored
- [ ] Transactional email delivery verified
- [ ] Error tracking and log retention configured
