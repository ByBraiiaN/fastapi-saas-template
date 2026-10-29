# Customization

The template is meant to be renamed and extended. There is no automated rename script; follow this checklist.

## 1. Identity

- Set `APP_NAME` in `.env`.
- Update `frontend/app/layout.tsx` metadata and fonts.
- Update `frontend/components/brand.tsx` and marketing copy under `frontend/app/(marketing)`.
- Update backend email templates in `backend/templates/email`.
- Replace sample support/company details in `backend/src/auth/emails.py`.

## 2. Visual system

- Design tokens: `frontend/app/globals.css`.
- Tailwind theme: CSS variables and `@theme` tokens in `frontend/app/globals.css` (Tailwind 4).
- Shared primitives: `frontend/components/ui`.
- Charts and admin surfaces: `frontend/components/admin`.

## 3. Plans and billing

- Edit `backend/scripts/seed_plans.py` for initial plans.
- Create products and prices in Paddle, then set `paddle_product_id` and `paddle_price_id` on each plan.
- Use `tier` (`FREE`, `PRO`, `VIP`) to guard premium endpoints with `require_plan(...)`.
- Free plans (`price_cents=0`, no `paddle_price_id`) activate locally without Paddle.

## 4. Domains and features

Each backend domain follows the same shape:

```text
backend/src/<domain>/
  router.py       # HTTP contract
  service.py      # business rules
  repository.py   # database access
  schemas.py      # request/response models
  models.py       # SQLAlchemy models
  dependencies.py # FastAPI dependencies
```

To add a new feature:

1. Create the domain package.
2. Import the model in `backend/src/load_models.py` so Alembic sees it.
3. Generate a migration with `alembic revision --autogenerate -m "add <feature>"`.
4. Register the router in `backend/src/main.py`.
5. Add frontend types and methods to `frontend/lib/api.ts`.

## 5. Shared contracts

- Export OpenAPI types and place them in `packages/shared`.
- Keep response models paginated consistently (`data`, `total`, `limit`, `offset`, `has_next`).

## 6. Authentication

- Local auth is enabled by default.
- Google/GitHub OAuth requires client IDs, secrets and callback URLs.
- To change JWT lifetimes, edit `ACCESS_TOKEN_EXPIRE`, `REFRESH_TOKEN_EXPIRE` and `VALIDATION_TOKEN_EXPIRE` (seconds).
- To change the cookie policy, edit `_set_refresh_cookie` in `backend/src/auth/router.py`.

## 7. Admin AI

- Set `GROQ_API_KEY` and optionally `AI_MODEL`.
- The SQL tool is intended to be read-only; review `backend/src/admin/ai_repo.py` before granting production database access.
- Prompts and responses are recorded in `admin_audit_logs`.

## 8. Branding checklist

- [ ] App name and logo
- [ ] Domain and support email
- [ ] Colors and typography
- [ ] Pricing copy and plan names
- [ ] Legal pages (`terms`, `privacy`)
- [ ] Email templates
- [ ] Social links and footer
- [ ] Favicon and Open Graph image
