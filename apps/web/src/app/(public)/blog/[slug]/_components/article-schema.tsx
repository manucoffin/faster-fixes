import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import type { Post } from "@repo/payload/payload-types";
import { Article, WithContext } from "schema-dts";

interface ArticleSchemaProps {
  post: Post;
}

export function ArticleSchema({ post }: ArticleSchemaProps) {
  const author = typeof post.author === "object" ? post.author : undefined;
  const featuredImage =
    typeof post.featuredImage === "object" ? post.featuredImage : undefined;
  const postCategory =
    typeof post.category === "object" ? post.category : undefined;

  const jsonLd: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: featuredImage?.url ? [featuredImage.url] : undefined,
    author: {
      "@type": "Person",
      name: author?.name || "Unknown Author",
      url: `${APP_URL}/blog/author/${author?.slug || ""}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/static/app-logo.png`,
      },
    },
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${APP_URL}/blog/${post.slug}`,
    },
    description: post.excerpt || post.meta?.description || "",
    keywords: post.tags?.length
      ? post.tags
          .map((tag) => (typeof tag === "object" ? tag.name : ""))
          .filter(Boolean)
          .join(", ")
      : undefined,
    articleSection: postCategory?.name,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
