import { getPayloadClient } from "@/lib/payload/client";
import { cache } from "react";

/**
 * Get the latest posts overall for the featured section
 */
export const getPosts = cache(async (limit: number = 100) => {
  const payload = await getPayloadClient();
  try {
    const result = await payload.find({
      collection: "posts",
      limit,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return result.docs;
  } catch (error) {
    console.error("Error fetching latest posts from Payload:", error);
    return [];
  }
});

export type GetPostsOutput = Awaited<ReturnType<typeof getPosts>>;
