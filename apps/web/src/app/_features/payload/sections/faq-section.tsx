import { RichText } from "@/app/_features/payload/_components/rich-text";
import { extractPlainTextFromRichText } from "@/utils/text/extract-plain-text-from-rich-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { H2 } from "@workspace/ui/components/headings";
import { Section } from "@workspace/ui/components/section";
import { FaqSchema } from "../../seo/faq-schema";

type FAQ = {
  question: string;
  answer: any;
};

type FAQSectionProps = {
  title: string;
  faqs: FAQ[];
};

export function FAQSection({ title, faqs }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Extract plain text for SEO schema
  const faqsWithPlainText = faqs.map((faq) => ({
    question: faq.question,
    answer: extractPlainTextFromRichText(faq.answer),
  }));

  return (
    <Section className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-2xl">
        <H2 className="mb-12 text-center">{title}</H2>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-b"
            >
              <AccordionTrigger className="hover:text-primary text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="prose dark:prose-invert max-w-none pt-4 pb-4">
                <RichText data={faq.answer} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <FaqSchema faqs={faqsWithPlainText} />
    </Section>
  );
}
