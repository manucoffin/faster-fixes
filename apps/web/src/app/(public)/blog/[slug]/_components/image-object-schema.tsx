import { APP_URL } from "@/app/_constants/app";
import type { Post } from "@repo/payload/payload-types";
import { ImageObject, WithContext } from "schema-dts";

interface ImageObjectSchemaProps {
  post: Post;
}

export function ImageObjectSchema({
  post,
}: ImageObjectSchemaProps) {
  const featuredImage =
    typeof post.featuredImage === "object" ? post.featuredImage : undefined;

  if (!featuredImage?.url) {
    return null;
  }

  const jsonLd: WithContext<ImageObject> = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${APP_URL}/blog/${post.slug}#featuredimage`,
    url: featuredImage.url,
    caption: featuredImage.alt || post.title,
    description: featuredImage.alt || `Featured image for ${post.title}`,
    width: featuredImage.width ? String(featuredImage.width) : undefined,
    height: featuredImage.height ? String(featuredImage.height) : undefined,
    contentUrl: featuredImage.url,
    representativeOfPage: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
