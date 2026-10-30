"use client";

import type { ListTestimonialsOutput } from "../../_services/list-testimonials";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { StarIcon } from "lucide-react";
import { TestimonialStatusAction } from "./testimonial-status-action.client";

type Testimonial = ListTestimonialsOutput[number];

const STATUS_BADGES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Pending review", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "outline" },
};

export function TestimonialsList() {
  const trpc = useTRPC();
  const testimonialsQuery = useQuery(
    trpc.admin.testimonials.list.queryOptions(),
  );

  return matchQueryStatus(testimonialsQuery, {
    Loading: (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
    Errored: (error) => (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load testimonials</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Empty: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No testimonials</EmptyTitle>
          <EmptyDescription>
            Testimonials appear here once a User submits one.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Success: ({ data }) => (
      <ul className="flex flex-col gap-4">
        {data.map((testimonial) => (
          <li key={testimonial.id}>
            <TestimonialRow testimonial={testimonial} />
          </li>
        ))}
      </ul>
    ),
  });
}

type TestimonialRowProps = {
  testimonial: Testimonial;
};

function TestimonialRow({ testimonial }: TestimonialRowProps) {
  const badge = STATUS_BADGES[testimonial.status] ?? {
    label: testimonial.status,
    variant: "outline",
  };
  const byline = [testimonial.authorTitle, testimonial.organizationName]
    .filter(Boolean)
    .join(", ");

  return (
    <figure className="space-y-4 rounded-lg border p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="text-sm text-muted-foreground">
            {testimonial.createdAt.toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}
          </span>
        </div>
        <div className="flex gap-2">
          {testimonial.status === "pending" ? (
            <>
              <TestimonialStatusAction
                testimonialId={testimonial.id}
                status="published"
              />
              <TestimonialStatusAction
                testimonialId={testimonial.id}
                status="rejected"
              />
            </>
          ) : null}
          {testimonial.status === "published" ? (
            <TestimonialStatusAction
              testimonialId={testimonial.id}
              status="pending"
            />
          ) : null}
        </div>
      </div>
      <blockquote className="whitespace-pre-line">
        {testimonial.text}
      </blockquote>
      <figcaption className="flex items-center gap-3 text-sm">
        <Avatar className="size-10">
          {testimonial.photoKey ? (
            <AvatarImage
              src={resolveS3Url(testimonial.photoKey)}
              alt={testimonial.authorName}
            />
          ) : null}
          <AvatarFallback>
            {testimonial.authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div>
            <span className="font-medium">{testimonial.authorName}</span>
            {byline ? (
              <span className="text-muted-foreground">, {byline}</span>
            ) : null}
          </div>
          {testimonial.websiteUrl ? (
            <a
              href={testimonial.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              {testimonial.websiteUrl}
            </a>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}
