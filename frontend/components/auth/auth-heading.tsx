type AuthHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthHeading({ eyebrow, title, description }: AuthHeadingProps) {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-primary-strong">{eyebrow}</p>
      <h1 className="mt-2 text-balance font-display text-3xl font-semibold tracking-[-0.045em] sm:text-[2.1rem]">
        {title}
      </h1>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
