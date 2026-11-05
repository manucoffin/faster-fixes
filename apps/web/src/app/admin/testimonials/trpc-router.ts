import { PUBLISHED_TESTIMONIALS_CACHE_TAG } from "@/app/_domains/testimonial/_services/list-published-testimonials";
import { adminProcedure, router } from "@/server/trpc/trpc";
import { revalidateTag } from "next/cache";
import { getTestimonialFunnel } from "./_services/get-testimonial-funnel";
import { listTestimonials } from "./_services/list-testimonials";
import { updateTestimonialStatus } from "./_services/update-testimonial-status";
import { UpdateTestimonialStatusSchema } from "./_services/update-testimonial-status.schema";

export const testimonialsRouter = router({
  getFunnel: adminProcedure.query(() =>
    getTestimonialFunnel({ now: new Date() }),
  ),
  list: adminProcedure.query(() => listTestimonials()),
  updateStatus: adminProcedure
    .input(UpdateTestimonialStatusSchema)
    .mutation(async ({ input }) => {
      const testimonial = await updateTestimonialStatus({
        ...input,
        now: new Date(),
      });
      // No stale window: the admin expects the homepage to match on the next load.
      revalidateTag(PUBLISHED_TESTIMONIALS_CACHE_TAG, { expire: 0 });
      return testimonial;
    }),
});
