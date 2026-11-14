import { APP_URL } from "@/app/_constants/app";
import { OG_IMAGE_SIZE, SITE_NAME, SITE_OG_LOCALE } from "@/app/_constants/seo";

type SocialMetadataInput = {
  // The page path, which also keys its card in the `/og` image route.
  path: string;
  title: string;
  description?: string;
  imageAlt?: string;
  article?: { publishedTime: string; modifiedTime: string };
};

function getOgImage(path: string, alt: string) {
  return {
    url: path === "/" ? "/og" : `/og${path}`,
    ...OG_IMAGE_SIZE,
    alt,
    type: "image/png",
  };
}

// Next merges metadata shallowly: a page's `openGraph` or `twitter` replaces
// the root layout's whole object, so every page has to restate the image,
// the card type, the site name and the locale.
export function buildSocialMetadata({
  path,
  title,
  description,
  imageAlt,
  article,
}: SocialMetadataInput) {
  const image = getOgImage(path, imageAlt ?? title);
  const shared = {
    title,
    description,
    url: path === "/" ? APP_URL : `${APP_URL}${path}`,
    siteName: SITE_NAME,
    locale: SITE_OG_LOCALE,
    images: [image],
  };

  return {
    openGraph: article
      ? { ...shared, type: "article" as const, ...article }
      : { ...shared, type: "website" as const },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [image],
    },
  };
}
