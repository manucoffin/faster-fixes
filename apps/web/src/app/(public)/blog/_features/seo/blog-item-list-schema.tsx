import { APP_URL } from "@/app/_constants/app";
import type { Post } from "@workspace/payload/payload-types";
import { ItemList, WithContext } from "schema-dts";

interface BlogItemListSchemaProps {
  posts: Post[];
}

export function BlogItemListSchema({ posts }: BlogItemListSchemaProps) {
  const jsonLd: WithContext<ItemList> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${APP_URL}/blog#itemlist`,
    name: "Tobalgo blog articles",
    description: "Latest blog articles",
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${APP_URL}/blog/${post.slug}`,
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
