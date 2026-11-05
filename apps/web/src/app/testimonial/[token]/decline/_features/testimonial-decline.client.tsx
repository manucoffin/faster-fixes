"use client";

import { PublicMessage } from "@/app/_components/public-message";
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
    <PublicMessage
      title="Stop testimonial requests"
      description="Confirm and you will not be asked for a testimonial again. Other emails from Faster Fixes are not affected."
    >
      <div className="flex justify-center">
        <ActionButton
          type="button"
          onClick={decline}
          pending={isPending}
          className="h-12 min-w-36 px-8 text-base"
        >
          Don&apos;t ask me again
        </ActionButton>
      </div>
    </PublicMessage>
  );
}
