import { getPayloadClient } from "@/lib/payload/client";
import { cache } from "react";

/**
 * Get related posts for a given post using Payload CMS
 */
export const getRelatedPosts = cache(
  async (postId: number, categoryId: number) => {
    const payload = await getPayloadClient();
    try {
      const result = await payload.find({
        collection: "posts",
        limit: 4,
        sort: "-publishedAt",
        where: {
          and: [
            {
              status: {
                equals: "published",
              },
            },
            {
              category: {
                equals: categoryId,
              },
            },
            {
              id: {
                not_equals: postId,
              },
            },
          ],
        },
      });

      return result.docs.slice(0, 3); // Limit to 3 related posts
    } catch (error) {
      console.error("Error fetching related posts:", error);
      return [];
    }
  },
);
