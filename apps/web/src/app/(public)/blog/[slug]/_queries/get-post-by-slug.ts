import { getPayloadClient } from "@/lib/payload/client";

/**
 * Get a post by its slug with full data including category, tags, and author
 */
export const getPostBySlug = async (slug: string) => {
  const payload = await getPayloadClient();
  try {
    const result = await payload.find({
      collection: "posts",
      where: {
        slug: {
          equals: slug,
        },
        status: {
          equals: "published",
        },
      },
      limit: 1,
      depth: 3, // Include related data like category, tags, author, and media
    });

    return result.docs[0] || null;
  } catch (error) {
    console.error("Error fetching post by slug from Payload:", error);
    return null;
  }
};
