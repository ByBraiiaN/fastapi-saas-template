import { cn } from "@/lib/utils";

type OrbitMarkProps = {
  className?: string;
};

export function OrbitMark({ className }: OrbitMarkProps) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink ring-1 ring-white/10",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="size-full" fill="none">
        <ellipse
          cx="20"
          cy="20"
          rx="14.5"
          ry="6"
          transform="rotate(-30 20 20)"
          stroke="#2DD4BF"
          strokeWidth="1.7"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="14.5"
          ry="6"
          transform="rotate(32 20 20)"
          stroke="#F59E0B"
          strokeWidth="1.4"
          strokeOpacity="0.9"
        />
        <circle cx="20" cy="20" r="3.2" fill="#F8FAFC" />
      </svg>
    </span>
  );
}

type OrbitLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function OrbitLogo({ className, markClassName, textClassName }: OrbitLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <OrbitMark className={markClassName} />
      <span
        className={cn(
          "font-display text-[1.35rem] font-semibold leading-none tracking-[-0.055em]",
          textClassName
        )}
      >
        Orbit
      </span>
    </span>
  );
}
