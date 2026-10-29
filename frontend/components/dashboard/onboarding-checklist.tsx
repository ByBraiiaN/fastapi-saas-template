import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, LayoutDashboard, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OnboardingChecklistProps = {
  hasSubscription: boolean;
};

type Step = {
  title: string;
  description: string;
  href: string;
  icon: typeof Mail;
  done: boolean;
};

export function OnboardingChecklist({ hasSubscription }: OnboardingChecklistProps) {
  const steps: Step[] = [
    {
      title: "Verify your email",
      description: "Confirm your address to protect your account.",
      href: "/verify",
      icon: Mail,
      done: false,
    },
    {
      title: "Choose a plan",
      description: "Start free or activate the plan you need.",
      href: "/dashboard/billing",
      icon: CreditCard,
      done: hasSubscription,
    },
    {
      title: "Explore the dashboard",
      description: "Review your account, settings, and preferences.",
      href: "/dashboard/account",
      icon: LayoutDashboard,
      done: false,
    },
  ];

  const completed = steps.filter((step) => step.done).length;

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Getting started</CardTitle>
          <Badge variant="muted">
            {completed} of {steps.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Complete the essentials to get the most out of the dashboard.
        </p>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="space-y-1">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title}>
                <Link
                  href={step.href}
                  className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/70"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
                      step.done
                        ? "bg-primary/10 text-primary-strong"
                        : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      <Icon className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        step.done && "text-muted-foreground line-through"
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
