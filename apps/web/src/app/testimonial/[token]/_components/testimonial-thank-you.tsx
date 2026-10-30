import type { SubmitTestimonialOutput } from "@/app/_domains/testimonial/_services/submit-testimonial";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { StarIcon } from "lucide-react";
import { TestimonialMessage } from "@/app/testimonial/_components/testimonial-message";

type TestimonialThankYouProps = {
  testimonial: SubmitTestimonialOutput;
};

export function TestimonialThankYou({ testimonial }: TestimonialThankYouProps) {
  const byline = [testimonial.authorTitle, testimonial.organizationName]
    .filter(Boolean)
    .join(", ");

  return (
    <TestimonialMessage
      title="Thank you"
      description="Your testimonial will appear on the site after review. To change anything, reply to the email you received."
    >
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
                  ? "size-4 fill-yellow-400 text-yellow-400"
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
    </TestimonialMessage>
  );
}
