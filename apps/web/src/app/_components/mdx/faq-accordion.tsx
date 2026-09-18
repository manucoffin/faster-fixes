import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import type { ReactNode } from "react";

type FaqAccordionItem = {
  question: string;
  answer: ReactNode;
};

type FaqAccordionProps = {
  items: FaqAccordionItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            value={`faq-${index}`}
            className="border-b"
          >
            <AccordionTrigger className="text-left text-base font-medium hover:text-primary">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="dark:prose-invert prose max-w-none pt-4 pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
