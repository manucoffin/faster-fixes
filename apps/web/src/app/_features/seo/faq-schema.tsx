import { FAQPage, WithContext } from "schema-dts";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSchemaProps {
  faqs: FaqItem[];
}

export function FaqSchema({ faqs }: FaqSchemaProps) {
  // Safety check to ensure faqs is an array and contains valid data
  if (!Array.isArray(faqs) || faqs.length === 0) {
    return null;
  }

  // Filter out FAQs with empty or missing answers
  const validFaqs = faqs.filter(
    (faq) => faq.answer && faq.answer.trim() !== ""
  );

  // If no valid FAQs remain, don't render the schema
  if (validFaqs.length === 0) {
    return null;
  }

  const jsonLd: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}