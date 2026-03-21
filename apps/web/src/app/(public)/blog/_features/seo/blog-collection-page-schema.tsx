import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { CollectionPage, WithContext } from "schema-dts";

export function BlogCollectionPageSchema() {
  const jsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${APP_URL}/blog`,
    url: `${APP_URL}/blog`,
    name: `Blog - ${SITE_NAME}`,
    description:
      "Expert tips for the well-being and health of your pets. Practical guides, veterinary advice, and news.",
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${APP_URL}#website`,
      url: APP_URL,
      name: SITE_NAME,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: APP_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${APP_URL}/blog`,
        },
      ],
    },
    about: {
      "@type": "Thing",
      name: "Blog Tobalgo",
      description:
        "Tips and articles on pet well-being",
    },
    significantLink: `${APP_URL}/blog`,
    relatedLink: `${APP_URL}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
