import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { getAppUrl } from "@/utils/url/get-app-url";
import { WebSite, WithContext } from "schema-dts";

const appUrl = getAppUrl()

export function WebSiteSchema() {
  const jsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${appUrl}#website`,
    name: SITE_NAME,
    url: appUrl,
    description: SITE_META_DESCRIPTION,
    inLanguage: "en-US",
    publisher: {
      "@id": `${appUrl}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${appUrl}/search?q={search_term_string}`,
      },
      query: "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
