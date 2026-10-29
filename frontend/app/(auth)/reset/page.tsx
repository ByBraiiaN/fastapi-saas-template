import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/reset-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "New password",
  description: "Create a new password for your Orbit account.",
};

function ResetFallback() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetForm />
    </Suspense>
  );
}
