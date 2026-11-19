import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import type { ReactNode } from "react";
import { SectionBody } from "../../features/_components/section-body";
import { SectionHeading } from "../../features/_components/section-heading";

export type VsFaqItem = FaqItem & { content?: ReactNode };

type VsFaqAnswerProps = {
  children: ReactNode;
};

// Answers with links render through this, so links pick up the section body style.
export function VsFaqAnswer({ children }: VsFaqAnswerProps) {
  return (
    <SectionBody className="max-w-2xl">
      <p>{children}</p>
    </SectionBody>
  );
}

type VsFaqSectionProps = {
  faqs: VsFaqItem[];
};

export function VsFaqSection({ faqs }: VsFaqSectionProps) {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeading className="lg:sticky lg:top-24 lg:self-start">
          Frequently asked questions
        </SectionHeading>

        <Accordion type="single" collapsible className="border-t">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="py-5 text-lg md:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                {faq.content ?? <VsFaqAnswer>{faq.answer}</VsFaqAnswer>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
