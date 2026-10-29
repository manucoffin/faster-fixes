import type { SubmitTestimonialOutput } from "@/app/_domains/testimonial/_services/submit-testimonial";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { StarIcon } from "lucide-react";

type TestimonialThankYouProps = {
  testimonial: SubmitTestimonialOutput;
};

export function TestimonialThankYou({ testimonial }: TestimonialThankYouProps) {
  const byline = [testimonial.authorTitle, testimonial.organizationName]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8 pt-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Thank you</h1>
        <p className="text-muted-foreground">
          Your testimonial will appear on the site after review. To change
          anything, reply to the email you received.
        </p>
      </div>
      <figure className="space-y-4 rounded-lg border p-6">
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
                  ? "size-4 fill-primary text-primary"
                  : "size-4 text-muted-foreground"
              }
            />
          ))}
        </div>
        <blockquote className="whitespace-pre-line">
          {testimonial.text}
        </blockquote>
        <figcaption className="flex items-center gap-3 text-sm">
          {testimonial.photoKey ? (
            <Avatar className="size-10">
              <AvatarImage
                src={resolveS3Url(testimonial.photoKey)}
                alt=""
                className="object-cover"
              />
              <AvatarFallback>
                {testimonial.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <span>
            <span className="font-medium">{testimonial.authorName}</span>
            {byline ? (
              <span className="text-muted-foreground">, {byline}</span>
            ) : null}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
