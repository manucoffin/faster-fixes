import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { publicProcedure, router } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { declineTestimonialRequest } from "./_services/decline-testimonial-request";
import { submitTestimonial } from "./_services/submit-testimonial";
import { SubmitTestimonialSchema } from "./_services/submit-testimonial.schema";
import { TestimonialTokenSchema } from "./_services/testimonial-token.schema";

// Reached from the Testimonial request emails without a session, so the rate
// limit is scoped to the request token instead of a User.
const testimonialTokenProcedure = publicProcedure
  .input(TestimonialTokenSchema)
  .use(async ({ input, next }) => {
    const { allowed } = await checkRateLimit(input.token, "testimonial-token");
    if (!allowed) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return next();
  });

export const testimonialRouter = router({
  submit: testimonialTokenProcedure
    .input(SubmitTestimonialSchema)
    .mutation(({ input: { token, ...testimonial } }) =>
      submitTestimonial({ token, now: new Date(), testimonial }),
    ),
  decline: testimonialTokenProcedure.mutation(({ input: { token } }) =>
    declineTestimonialRequest({ token, now: new Date() }),
  ),
});
