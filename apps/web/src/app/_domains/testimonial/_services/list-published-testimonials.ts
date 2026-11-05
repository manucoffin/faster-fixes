import { prisma } from "@workspace/db";
import { unstable_cache } from "next/cache";

// Revalidated by the admin status change, so a newly published Testimonial
// shows on the homepage without waiting for the hourly refresh.
export const PUBLISHED_TESTIMONIALS_CACHE_TAG = "published-testimonials";

export const listPublishedTestimonials = unstable_cache(
  () =>
    prisma.testimonial.findMany({
      where: { status: "published" },
      orderBy: { statusChangedAt: "desc" },
      select: {
        id: true,
        rating: true,
        text: true,
        authorName: true,
        authorTitle: true,
        organizationName: true,
        websiteUrl: true,
        photoKey: true,
      },
    }),
  ["published-testimonials"],
  { tags: [PUBLISHED_TESTIMONIALS_CACHE_TAG], revalidate: 3600 },
);

export type ListPublishedTestimonialsOutput = Awaited<
  ReturnType<typeof listPublishedTestimonials>
>;
