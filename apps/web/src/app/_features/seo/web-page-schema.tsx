import { WebPage, WithContext } from "schema-dts";

interface WebPageSchemaProps {
  title: string;
  description: string;
  url: string;
  language?: string;
  datePublished?: string | null;
  dateModified?: string | null;
  /** Schema.org @id of the entity the page is about (e.g. SoftwareApplication). */
  aboutId?: string;
}

export function WebPageSchema({
  title,
  description,
  url,
  language = "en-US",
  datePublished,
  dateModified,
  aboutId,
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
    ...(aboutId && {
      about: { "@id": aboutId },
      mainEntity: { "@id": aboutId },
    }),
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
