import { logos } from "@/lib/content";

export function LogoStrip() {
  return (
    <section className="border-y border-border/70 bg-card/40" aria-label="Teams using Orbit">
      <div className="shell flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:py-9">
        <p className="max-w-[16rem] text-sm leading-snug text-muted-foreground">
          Teams that traded tab chaos for a single view.
        </p>
        <div className="flex flex-wrap items-center gap-x-9 gap-y-5 text-foreground/55 lg:gap-x-11">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className={`${logo.className} select-none transition-colors duration-200 hover:text-foreground`}
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
