import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Changes, improvements, and fixes in the Orbit template.",
};

const entries = [
  {
    version: "0.5.0",
    date: "October 27, 2026",
    type: "Improvement",
    title: "New visual foundation and complete landing page",
    body: "We rewrote the marketing layer with its own identity, accessible components, and pricing connected to the real catalog.",
    items: [
      "Bricolage Grotesque and Instrument Sans typography, semantic tokens, and dark mode.",
      "Asymmetric landing page with a product mockup, feature bento, testimonials, and FAQ.",
      "Monthly/yearly selector connected to billing_period with a catalog fallback.",
      "Route groups for marketing, auth, and checkout without changing URLs.",
    ],
  },
  {
    version: "0.4.0",
    date: "September 20, 2026",
    type: "New",
    title: "Paddle as Merchant of Record",
    body: "Billing moves to hosted checkout with webhook sync and cancellation at the end of the period.",
    items: [
      "Hosted checkout and upgrades with in-place proration.",
      "Signed, idempotent webhook with retries.",
      "Payment history and transactional emails.",
    ],
  },
  {
    version: "0.3.0",
    date: "August 18, 2026",
    type: "New",
    title: "Admin panel",
    body: "A place to check the pulse of the business without writing queries by hand.",
    items: [
      "User, subscription, and transaction stats.",
      "Role, status, and account verification changes.",
      "Role-protected access with basic audit logging.",
    ],
  },
  {
    version: "0.2.1",
    date: "August 2, 2026",
    type: "Fix",
    title: "Authentication hardening",
    body: "Hardening for tokens, sign-in codes, and account recovery.",
    items: [
      "Refresh token rotation and global revocation on sign-in.",
      "Six-digit single-use OTP with a 15-minute expiry.",
      "Rate limiting on sensitive endpoints and OAuth state validation.",
    ],
  },
  {
    version: "0.1.0",
    date: "July 15, 2026",
    type: "Foundation",
    title: "First internal version",
    body: "The skeleton of the template: monorepo, FastAPI API, and Next.js frontend.",
    items: [
      "Registration, login, email verification, and password recovery.",
      "First plan catalog and subscription structure.",
      "Docker Compose environment with PostgreSQL and Redis.",
    ],
  },
];

const typeVariant: Record<string, "default" | "secondary" | "outline" | "accent"> = {
  Improvement: "default",
  New: "accent",
  Fix: "outline",
  Foundation: "secondary",
};

export default function ChangelogPage() {
  return (
    <>
      <section className="border-b border-border/70">
        <div className="shell py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
              <span className="h-px w-6 bg-primary" aria-hidden />
              Changelog
            </span>
            <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl">
              What changes, when it changes.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              Template release notes. No grand announcements: just what moved and
              why.
            </p>
          </div>
        </div>
      </section>

      <div className="shell max-w-4xl py-14">
        <ol className="relative border-l border-border/80 pl-6 sm:pl-8">
          {entries.map((entry, index) => (
            <li key={entry.version} className={index === entries.length - 1 ? "" : "pb-12"}>
              <span
                className="absolute -left-[5px] mt-2 size-2.5 rounded-full border-2 border-background bg-primary"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  v{entry.version}
                </span>
                <Badge variant={typeVariant[entry.type] ?? "secondary"}>{entry.type}</Badge>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{entry.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
              <ul className="mt-4 space-y-2">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-border" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border bg-card p-6">
          <p className="text-sm font-medium">Looking for the technical details?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            The documentation covers the API, authentication, and the billing flow.
          </p>
          <Link
            href="/docs"
            className="mt-4 inline-flex rounded-sm text-sm font-medium text-primary-strong underline-offset-4 hover:underline"
          >
            Open the documentation
          </Link>
        </div>
      </div>
    </>
  );
}
