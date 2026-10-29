"use client";

import Link from "next/link";
import { faqs } from "@/lib/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border/70 bg-surface/60 py-20 sm:py-28">
      <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-strong">
            <span className="h-px w-6 bg-primary" aria-hidden />
            Reasonable questions
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-4xl">
            What people usually ask before starting.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            If something is missing, write to us. We reply with context, not an automated template.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex rounded-sm text-sm font-medium text-primary-strong underline-offset-4 hover:underline"
          >
            Talk to the team
          </Link>
        </div>

        <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
          {faqs.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
