import { adminProcedure, router } from "@/server/trpc/trpc";
import { listTestimonials } from "./_services/list-testimonials";
import { updateTestimonialStatus } from "./_services/update-testimonial-status";
import { UpdateTestimonialStatusSchema } from "./_services/update-testimonial-status.schema";

export const testimonialsRouter = router({
  list: adminProcedure.query(() => listTestimonials()),
  updateStatus: adminProcedure
    .input(UpdateTestimonialStatusSchema)
    .mutation(({ input }) =>
      updateTestimonialStatus({ ...input, now: new Date() }),
    ),
});
