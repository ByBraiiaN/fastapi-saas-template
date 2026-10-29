import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Checkout canceled",
  description: "You were not charged. You can try again whenever you like.",
};

export default function CheckoutCancelPage() {
  return (
    <Card className="w-full max-w-md p-7">
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <CreditCard className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        You were not charged
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You canceled checkout before finishing. Your current plan is unchanged and you can pick up
        where you left off whenever you like.
      </p>
      <div className="mt-6 grid gap-2">
        <Button asChild size="lg">
          <Link href="/pricing">Back to plans</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </Card>
  );
}
