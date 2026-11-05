// The name every new User's organization starts with
// (server/auth/config/database-hooks.ts). Authors who never renamed it submit
// it as is, and it says nothing about them.
const DEFAULT_ORGANIZATION_NAME = "my organization";

type TestimonialAffiliationInput = {
  authorTitle: string | null;
  organizationName: string;
  websiteUrl: string | null;
};

function getWebsiteHost(websiteUrl: string) {
  try {
    return new URL(websiteUrl).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getTestimonialAffiliation({
  authorTitle,
  organizationName,
  websiteUrl,
}: TestimonialAffiliationInput) {
  const title = authorTitle?.trim();
  const name = organizationName.trim();
  const isDefaultName = name.toLowerCase() === DEFAULT_ORGANIZATION_NAME;
  const host = websiteUrl ? getWebsiteHost(websiteUrl) : null;

  return {
    title: title === undefined || title === "" ? null : title,
    // Without a usable organization name, the website host labels the link.
    organization: name && !isDefaultName ? name : host,
    websiteUrl: host ? websiteUrl : null,
  };
}
