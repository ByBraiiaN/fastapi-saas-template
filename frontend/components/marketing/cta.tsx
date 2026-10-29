import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="shell">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-white shadow-lift sm:px-10 lg:px-16 lg:py-20">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "52px 52px",
              maskImage: "radial-gradient(ellipse at 70% 20%, black 10%, transparent 72%)",
            }}
            aria-hidden
          />
          <div
            className="absolute -right-20 -top-32 size-[420px] rounded-full border border-white/10"
            aria-hidden
          >
            <div className="absolute inset-14 rounded-full border border-primary/25" />
            <div className="absolute inset-28 rounded-full border border-dashed border-white/15" />
            <div className="absolute right-24 top-2 size-3 rounded-full bg-accent" />
          </div>
          <div
            className="absolute -bottom-32 right-1/4 size-64 rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />

          <div className="relative max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              SaaS template ready to adapt
            </p>
            <h2 className="mt-6 text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Put your operation in orbit.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/65 sm:text-lg">
              Start with authentication, plans, and billing already connected. Spend your time on
              what makes your product unique.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:border-white/35 hover:bg-white/10 hover:text-white"
              >
                <Link href="/docs">Read the documentation</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/60">
              No card. No commitment. Set it up in minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
