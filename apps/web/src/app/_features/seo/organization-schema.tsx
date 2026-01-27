import { CONTACT_EMAIL } from "@/app/_constants/app";
import { COMPANY_ADDRESS_COUNTRY, COMPANY_ADDRESS_LOCALITY, COMPANY_ADDRESS_REGION, COMPANY_POSTAL_CODE, COMPANY_STREET_ADDRESS, INSTAGRAM_URL, LINKEDIN_URL, TIKTOK_URL, YOUTUBE_URL } from "@/app/_constants/company";
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
      streetAddress: COMPANY_STREET_ADDRESS,
      addressLocality: COMPANY_ADDRESS_LOCALITY,
      addressRegion: COMPANY_ADDRESS_REGION,
      postalCode: COMPANY_POSTAL_CODE,
      addressCountry: COMPANY_ADDRESS_COUNTRY,
    },
    sameAs: [
      INSTAGRAM_URL,
      TIKTOK_URL,
      LINKEDIN_URL,
      YOUTUBE_URL,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
