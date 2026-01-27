import { APP_URL } from "@/app/_constants/app";
import { ITEMS_PER_SITEMAP } from "@/app/_constants/seo";
import { getPayloadClient } from "@/lib/payload/client";
import type { MetadataRoute } from "next";

export async function generateSitemaps() {
  const payload = await getPayloadClient();
  try {
    // Get all published posts from Payload
    const postsResult = await payload.find({
      collection: "posts",
      limit: 10000, // Get all posts
      where: {
        status: {
          equals: "published",
        },
      },
    });

    const posts = postsResult.docs;

    const totalBlogPosts = posts.length;
    const sitemapCount = Math.ceil(totalBlogPosts / ITEMS_PER_SITEMAP);

    return Array.from({ length: Math.max(sitemapCount, 1) }, (_, i) => ({
      id: i,
    }));
  } catch (error) {
    console.error("Error generating sitemaps from Payload:", error);
    return [{ id: 0 }]; // Return at least one sitemap
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const fallbackDate = new Date("1970-01-01");

  try {
    // Get all published posts from Payload
    const postsResult = await payload.find({
      collection: "posts",
      limit: 10000, // Get all posts
      where: {
        status: {
          equals: "published",
        },
      },
    });

    const posts = postsResult.docs;

    // Map posts to sitemap items
    const allItems = posts.map((post: any) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: new Date(
        post.updatedAt || post.createdAt || fallbackDate,
      ),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    // Calculate the slice for this sitemap
    const start = id * ITEMS_PER_SITEMAP;
    const end = start + ITEMS_PER_SITEMAP;

    return allItems.slice(start, end).map((item) => ({
      url: item.url,
      lastModified: item.lastModified,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    }));
  } catch (error) {
    console.error("Error generating sitemap from Payload:", error);
    return []; // Return empty sitemap on error
  }
}
