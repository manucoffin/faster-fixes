import { listPublishedTestimonials } from "@/app/_domains/testimonial/_services/list-published-testimonials";

import { TestimonialCard } from "./testimonial-card";
import { TestimonialsMasonry } from "./testimonials-masonry.client";

export async function TestimonialsSection() {
  // An optional section: a database outage hides it rather than taking down the homepage.
  const testimonials = await listPublishedTestimonials().catch(
    (error: unknown) => {
      console.error("Failed to list published Testimonials", error);
      return [];
    },
  );

  if (testimonials.length === 0) return null;

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Testimonials
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            What users say about FasterFixes
          </h2>
        </div>

        <TestimonialsMasonry
          items={testimonials.map((testimonial) => ({
            id: testimonial.id,
            text: testimonial.text,
            card: <TestimonialCard testimonial={testimonial} />,
          }))}
        />
      </div>
    </section>
  );
}
