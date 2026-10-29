import { Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { testimonials } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Testimonials() {
  const [featured, ...rest] = testimonials;

  return (
    <section className="py-20 sm:py-28">
      <div className="shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
              <span className="h-px w-6 bg-primary" aria-hidden />
              In production
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              Stories that start with data.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Small teams that needed to stop rebuilding the truth every Monday
              morning.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Illustrative scenarios for the template.</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Card className="relative flex flex-col justify-between overflow-hidden p-7 shadow-soft lg:col-span-7 lg:p-9">
            <Quote className="size-9 text-primary/25" aria-hidden />
            <blockquote className="mt-6 text-balance font-display text-2xl font-medium leading-[1.18] tracking-[-0.035em] sm:text-[2rem]">
              “{featured.quote}”
            </blockquote>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-border/70 pt-6">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className={cn(featured.accent, "text-white")}>
                    {featured.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{featured.name}</p>
                  <p className="text-xs text-muted-foreground">{featured.role}</p>
                </div>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary-strong">
                {featured.metric}
              </span>
            </div>
          </Card>

          <div className="grid gap-4 lg:col-span-5">
            {rest.map((testimonial) => (
              <Card key={testimonial.name} className="flex flex-col justify-between p-6">
                <blockquote className="text-pretty text-[15px] leading-relaxed text-foreground/85">
                  “{testimonial.quote}”
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback
                      className={cn(
                        testimonial.accent,
                        testimonial.accent === "bg-accent" ? "text-ink" : "text-white"
                      )}
                    >
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
