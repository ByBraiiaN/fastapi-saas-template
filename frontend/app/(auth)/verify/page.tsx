import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyForm } from "@/components/auth/verify-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email to activate your Orbit account.",
};

function VerifyFallback() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyForm />
    </Suspense>
  );
}
