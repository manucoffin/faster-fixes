import { WebPage, WithContext } from "schema-dts";

interface WebPageSchemaProps {
  title: string;
  description: string;
  url: string;
  language?: string;
  datePublished?: string | null;
  dateModified?: string | null;
}

export function WebPageSchema({
  title,
  description,
  url,
  language = "fr-FR",
  datePublished,
  dateModified,
}: WebPageSchemaProps) {
  const jsonLd: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name: title,
    description,
    url,
    inLanguage: language,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    isPartOf: {
      "@id": url.split("/").slice(0, 3).join("/") + "#website",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
