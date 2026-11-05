import { getTestimonialAffiliation } from "@/app/_domains/testimonial/_helpers/get-testimonial-affiliation";
import {
  listPublishedTestimonials,
  type ListPublishedTestimonialsOutput,
} from "@/app/_domains/testimonial/_services/list-published-testimonials";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { StarIcon } from "lucide-react";

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

        {/* Flex wrap rather than a grid, so one or two cards stay centered. */}
        <ul className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-center gap-6">
          {testimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className="flex w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <TestimonialCard testimonial={testimonial} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type TestimonialCardProps = {
  testimonial: ListPublishedTestimonialsOutput[number];
};

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { title, organization, websiteUrl } =
    getTestimonialAffiliation(testimonial);

  return (
    <figure className="flex w-full flex-col rounded-xl border bg-card p-7">
      <div
        className="flex gap-0.5"
        role="img"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            aria-hidden
            className={
              index < testimonial.rating
                ? "size-4 fill-yellow-400 text-yellow-400"
                : "size-4 text-muted-foreground/40"
            }
          />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 text-lg leading-relaxed whitespace-pre-line">
        {testimonial.text}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t pt-5 text-sm">
        <Avatar className="size-10">
          {testimonial.photoKey ? (
            <AvatarImage
              src={resolveS3Url(testimonial.photoKey)}
              alt={testimonial.authorName}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback>
            {testimonial.authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium">{testimonial.authorName}</div>
          {title || organization ? (
            <div className="text-muted-foreground">
              {title}
              {title && organization ? ", " : null}
              {organization && websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {organization}
                </a>
              ) : (
                organization
              )}
            </div>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}
