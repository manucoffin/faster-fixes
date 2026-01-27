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
      "Découvrez nos conseils d'experts pour le bien-être et la santé de vos animaux de compagnie. Guides pratiques, astuces vétérinaires et actualités.",
    inLanguage: "fr-FR",
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
          name: "Accueil",
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
        "Conseils et articles sur le bien-être des animaux de compagnie",
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
