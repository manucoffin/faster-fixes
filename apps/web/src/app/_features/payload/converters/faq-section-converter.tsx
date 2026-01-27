import { RichText } from "@/app/_features/payload/_components/rich-text";
import { extractPlainTextFromRichText } from "@/utils/text/extract-plain-text-from-rich-text";
import { JSXConverters } from "@payloadcms/richtext-lexical/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { FaqSchema } from "../../seo/faq-schema";

type FAQ = {
  question: string;
  answer: any;
};

export const faqSectionConverter: JSXConverters<any> = {
  faq: ({ node }) => {
    const { title, faqs } = node.fields;

    if (!faqs || faqs.length === 0) {
      return null;
    }

    // Extract plain text for SEO schema
    const faqsWithPlainText = faqs.map((faq: FAQ) => ({
      question: faq.question,
      answer: extractPlainTextFromRichText(faq.answer),
    }));

    return (
      <>
        <Accordion type="single" collapsible className="">
          {faqs.map((faq: FAQ, index: number) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-b"
            >
              <AccordionTrigger className="text-base" headerClassName="not-prose">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent >
                <RichText data={faq.answer} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <FaqSchema faqs={faqsWithPlainText} />
      </>
    );
  },
};
