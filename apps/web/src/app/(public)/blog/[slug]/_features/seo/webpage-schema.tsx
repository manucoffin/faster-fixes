import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import type { Post } from "@workspace/payload/payload-types";
import { WebPage, WithContext } from "schema-dts";

interface WebPageSchemaProps {
  post: Post;
}

export function WebPageSchema({ post }: WebPageSchemaProps) {
  const author = typeof post.author === "object" ? post.author : undefined;
  const featuredImage =
    typeof post.featuredImage === "object" ? post.featuredImage : undefined;

  const jsonLd: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${APP_URL}/blog/${post.slug}`,
    url: `${APP_URL}/blog/${post.slug}`,
    name: `${post.title} - ${SITE_NAME}`,
    description:
      post.excerpt ||
      post.meta?.description ||
      `Read ${post.title} on ${SITE_NAME}`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${APP_URL}#website`,
      url: APP_URL,
      name: SITE_NAME,
    },
    about: {
      "@type": "Thing",
      name: post.title,
      description: post.excerpt || post.meta?.description || undefined,
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
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: `${APP_URL}/blog/${post.slug}`,
        },
      ],
    },
    mainEntity: {
      "@type": "Article",
      "@id": `${APP_URL}/blog/${post.slug}#article`,
      headline: post.title,
      description: post.excerpt || post.meta?.description || undefined,
      image: featuredImage?.url ? [featuredImage.url] : undefined,
      author: {
        "@type": "Person",
        name: author?.name || "Unknown Author",
        url: `${APP_URL}/blog/auteur/${author?.slug || ""}`,
      },
      datePublished: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date(post.createdAt).toISOString(),
      dateModified: new Date(post.updatedAt).toISOString(),
    },
    primaryImageOfPage: featuredImage?.url
      ? {
        "@type": "ImageObject",
        url: featuredImage.url,
        caption: featuredImage.alt || post.title,
      }
      : undefined,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name: author?.name || "Unknown Author",
      url: `${APP_URL}/blog/auteur/${author?.slug || ""}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/static/app-logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
