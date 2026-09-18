import type { HowTo as HowToSchema, HowToStep, WithContext } from "schema-dts";

type HowToStepInput = {
  name: string;
  text: string;
  url?: string;
  image?: string;
};

type HowToProps = {
  name: string;
  description?: string;
  totalTime?: string; // ISO 8601 duration, e.g. "PT15M"
  steps: HowToStepInput[];
};

export function HowTo({ name, description, totalTime, steps }: HowToProps) {
  const jsonLd: WithContext<HowToSchema> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    ...(description ? { description } : {}),
    ...(totalTime ? { totalTime } : {}),
    step: steps.map<HowToStep>((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
      ...(step.image ? { image: step.image } : {}),
    })),
  };

  return (
    <section className="not-prose my-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-4">
        <h3 className="text-2xl font-bold tracking-tight">{name}</h3>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </header>
      <ol className="list-decimal space-y-3 pl-6">
        {steps.map((step) => (
          <li key={step.name}>
            <span className="font-semibold">{step.name}</span>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
