"use client";

import { ActionButton } from "@workspace/ui/components/action-button";
import { TestimonialDeclined } from "../_components/testimonial-declined";
import { TestimonialRequestHandled } from "../_components/testimonial-request-handled";
import { useDeclineTestimonialRequest } from "./use-decline-testimonial-request";

type TestimonialDeclineProps = {
  token: string;
};

export function TestimonialDecline({ token }: TestimonialDeclineProps) {
  const { decline, isPending, status } = useDeclineTestimonialRequest(token);

  if (status === "declined") return <TestimonialDeclined />;
  if (status === "handled") return <TestimonialRequestHandled />;

  return (
    <div className="space-y-6 pt-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Stop testimonial requests</h1>
        <p className="text-muted-foreground">
          Confirm and you will not be asked for a testimonial again. Other
          emails from Faster Fixes are not affected.
        </p>
      </div>
      <ActionButton type="button" onClick={decline} pending={isPending}>
        Don&apos;t ask me again
      </ActionButton>
    </div>
  );
}
