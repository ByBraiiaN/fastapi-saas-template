import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessContent } from "@/components/checkout/success-content";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Payment complete",
  description: "Your subscription status after Paddle checkout.",
};

function SuccessFallback() {
  return (
    <Card className="w-full max-w-md p-7">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="mt-4 h-7 w-52" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-6 h-28 w-full" />
      <Skeleton className="mt-6 h-11 w-full" />
    </Card>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
