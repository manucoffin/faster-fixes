import { prisma } from "@workspace/db";

export async function listTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      rating: true,
      text: true,
      authorName: true,
      authorTitle: true,
      organizationName: true,
      websiteUrl: true,
      photoKey: true,
      status: true,
    },
  });
}

export type ListTestimonialsOutput = Awaited<
  ReturnType<typeof listTestimonials>
>;
