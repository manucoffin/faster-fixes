import { getAppUrl } from "@/utils/url/get-app-url";
import { Person, WithContext } from "schema-dts";

const appUrl = getAppUrl()

interface PersonSchemaProps {
  name: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  email?: string;
  telephone?: string;
  image?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  worksFor?: {
    name: string;
    url?: string;
  };
  alumniOf?: string[];
  knows?: string[];
}

export function PersonSchema({
  name,
  jobTitle,
  description,
  url,
  email,
  telephone,
  image,
  birthDate,
  gender,
  nationality,
  address,
  socialLinks,
  worksFor,
  alumniOf,
  knows,
}: PersonSchemaProps) {
  const jsonLd: WithContext<Person> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": url
      ? `${url}#person`
      : `${appUrl}/person/${name.toLowerCase().replace(/\s+/g, "-")}#person`,
    name,
    jobTitle,
    description,
    url,
    email,
    telephone,
    image: image
      ? {
        "@type": "ImageObject",
        url: image,
      }
      : undefined,
    birthDate,
    gender,
    nationality,
    address: address
      ? {
        "@type": "PostalAddress",
        streetAddress: address.streetAddress,
        addressLocality: address.addressLocality,
        addressRegion: address.addressRegion,
        postalCode: address.postalCode,
        addressCountry: address.addressCountry,
      }
      : undefined,
    sameAs: socialLinks
      ? ([
        socialLinks.facebook,
        socialLinks.twitter,
        socialLinks.instagram,
        socialLinks.linkedin,
        socialLinks.website,
      ].filter(Boolean) as string[])
      : undefined,
    worksFor: worksFor
      ? {
        "@type": "Organization",
        name: worksFor.name,
        url: worksFor.url,
      }
      : undefined,
    alumniOf: alumniOf?.map((school) => ({
      "@type": "EducationalOrganization",
      name: school,
    })),
    knows: knows?.map((person) => ({
      "@type": "Person",
      name: person,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
