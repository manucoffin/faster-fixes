import type { HowTo, WithContext } from "schema-dts";

type HowToStepInput = {
  name: string;
  text: string;
  url?: string;
};

type HowToSchemaProps = {
  name: string;
  description?: string;
  steps: HowToStepInput[];
  totalTime?: string;
};

export function HowToSchema({
  name,
  description,
  steps,
  totalTime,
}: HowToSchemaProps) {
  const jsonLd: WithContext<HowTo> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    ...(description && { description }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
