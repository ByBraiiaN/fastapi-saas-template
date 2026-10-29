import Link from "next/link";
import { OrbitLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
        aria-hidden
      >
        <div className="absolute inset-20 rounded-full border border-dashed border-primary/10" />
        <div className="absolute inset-40 rounded-full border border-accent/10" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <Link href="/" className="inline-flex rounded-lg" aria-label="Orbit, go to home">
          <OrbitLogo />
        </Link>
        <p className="mt-10 font-mono text-xs tracking-[0.3em] text-muted-foreground">404</p>
        <h1 className="mt-3 text-balance font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          This orbit does not exist.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          The page you are looking for moved or was never here. Go back home or check the
          documentation.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/docs">View documentation</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
