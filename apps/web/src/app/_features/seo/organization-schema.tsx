import { CONTACT_EMAIL } from "@/app/_constants/app";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { getAppUrl } from "@/utils/url/get-app-url";
import { Organization, WithContext } from "schema-dts";

export function OrganizationSchema() {
  const appUrl = getAppUrl()

  const jsonLd: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${appUrl}#organization`,
    name: SITE_NAME,
    url: appUrl,
    logo: {
      "@type": "ImageObject",
      url: `${appUrl}/static/app-logo.png`,
    },
    description: SITE_META_DESCRIPTION,
    email: CONTACT_EMAIL,
    // telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "32 rue de la Claire",
      addressLocality: "Lyon",
      addressRegion: "Auvergne Rhône-Alpes",
      postalCode: "69009",
      addressCountry: "France",
    },
    sameAs: [
      "https://www.instagram.com/tobalgo",
      "https://www.linkedin.com/company/tobalgo/",
      "https://www.youtube.com/channel/UC9lGVh-kRMyYKOxFpkOttsA",
      "https://www.tiktok.com/@tobalgo",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
