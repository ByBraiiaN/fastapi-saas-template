import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Building2, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Orbit team about product, support, or template customizations.",
};

const channels = [
  {
    icon: Mail,
    title: "Product and demos",
    description: "Tell us what you want to build and we will help you fit the template to it.",
    email: "hello@orbit.example",
    meta: "Reply within 1 business day",
  },
  {
    icon: LifeBuoy,
    title: "Technical support",
    description: "Issues with the API, webhooks, or the development environment.",
    email: "support@orbit.example",
    meta: "Pro and Scale plans",
  },
  {
    icon: Building2,
    title: "Partnerships and press",
    description: "Integrations, collaborations, or brand assets.",
    email: "team@orbit.example",
    meta: "Reply within 2 business days",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    description: "Report a vulnerability responsibly.",
    email: "security@orbit.example",
    meta: "Priority review",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-40" aria-hidden />
        <div className="shell relative py-16 sm:py-20">
          <div className="max-w-2xl">
            <Badge variant="outline">Contact</Badge>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl">
              Let&apos;s talk about what is next.
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              We are a small team. Write to us with context and a person will reply, not an
              endless form.
            </p>
          </div>
        </div>
      </section>

      <div className="shell grid gap-10 py-14 lg:grid-cols-[1fr_340px] lg:gap-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.title} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
                <span className="grid size-10 place-items-center rounded-xl border bg-surface text-primary">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <h2 className="mt-4 text-base font-semibold">{channel.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
                <a
                  href={`mailto:${channel.email}`}
                  className="mt-5 rounded-sm text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {channel.email}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">{channel.meta}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-ink p-6 text-white">
            <p className="text-sm font-medium text-white/60">First time here?</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              The documentation gets to the point.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Quickstart, authentication, billing, and deployment. Everything you need to get
              a version running.
            </p>
            <Button asChild variant="accent" className="mt-5 w-full">
              <Link href="/docs">
                <BookOpen className="size-4" aria-hidden />
                Read the documentation
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold">Before you write</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This is an example domain. Replace the email addresses with your team&apos;s before
              publishing the template.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Reference hours: Monday to Friday, 9:00–18:00 CET.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
