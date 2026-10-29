import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type LegalDocProps = {
  title: string;
  description: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalDoc({ title, description, updated, children }: LegalDocProps) {
  return (
    <>
      <section className="border-b border-border/70">
        <div className="shell py-16 sm:py-20">
          <div className="max-w-3xl">
            <Badge variant="outline">Legal</Badge>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Last updated: {updated}</p>
          </div>
        </div>
      </section>

      <div className="shell max-w-4xl py-14">
        <Alert variant="warning">
          <Info className="size-4" aria-hidden />
          <AlertTitle>Sample document</AlertTitle>
          <AlertDescription>
            This text is part of the template and does not constitute legal advice. Review and
            adapt each clause with a professional before publishing your product.
          </AlertDescription>
        </Alert>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground [&_a]:rounded-sm [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 [&_a]:hover:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </>
  );
}
