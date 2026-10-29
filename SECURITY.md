# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| < 0.1 | No |

This is a template, not an audited product. Review the code and configuration before using it in production.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Send a private report to the maintainers with:

- A description of the vulnerability and its impact.
- Steps to reproduce or a proof of concept.
- Affected version, commit or file paths.
- Any suggested mitigation.

If the repository has GitHub private vulnerability reporting enabled, use **Security > Report a vulnerability** instead of email.

## What to expect

- Acknowledgement within 48 hours.
- Triage and severity assessment within 5 business days.
- A fix or mitigation plan for confirmed issues.
- Credit in the release notes if you want it.

## Scope

In scope:

- Authentication and authorization bypasses.
- JWT, refresh-token or OTP weaknesses.
- Paddle webhook signature or idempotency bypasses.
- SQL injection, especially through the admin AI assistant.
- Secret exposure, SSRF, path traversal and unsafe file handling.
- Privilege escalation in admin routes.

Out of scope:

- Vulnerabilities in third-party services or dependencies that are already publicly known and patched upstream.
- Missing hardening explicitly documented as a template limitation (for example, clients that still expect `refresh_token` in JSON).
- Denial of service through unrealistic resource consumption.
- Social engineering.

## Secure deployment reminders

- Rotate every secret from `.env.example`; the defaults are not safe.
- Set `APP_ENV=production`, `PADDLE_ENV=production` and HTTPS.
- Keep `PADDLE_WEBHOOK_SECRET`, SMTP credentials and JWT keys out of git.
- Restrict PostgreSQL and Redis to the private network.
- Review `docs/deployment.md` before going live.
