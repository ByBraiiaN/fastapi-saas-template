"use client";

import { useEffect } from "react";
import Link from "next/link";
import { OrbitMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-orbital-glow" aria-hidden />
      <div className="relative w-full max-w-md text-center">
        <OrbitMark className="mx-auto size-12 rounded-2xl" />
        <p className="mt-8 font-mono text-xs tracking-[0.3em] text-muted-foreground">ERROR</p>
        <h1 className="mt-3 text-balance font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Something went off orbit.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          We could not complete this view. You can try again or head back home while we
          look into what happened.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">Ref: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" size="lg" onClick={reset}>
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
