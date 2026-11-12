import { getTestimonialAffiliation } from "@/app/_domains/testimonial/_helpers/get-testimonial-affiliation";
import { type ListPublishedTestimonialsOutput } from "@/app/_domains/testimonial/_services/list-published-testimonials";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { StarIcon } from "lucide-react";

type TestimonialCardProps = {
  testimonial: ListPublishedTestimonialsOutput[number];
};

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
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
      {/* The masonry reads this element's font to measure every quote. */}
      <blockquote
        data-testimonial-text
        className="mt-5 text-lg leading-relaxed break-words whitespace-pre-line"
      >
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
