"use client";

import type { GetTestimonialFunnelOutput } from "../_services/get-testimonial-funnel";
import {
  HeadlineFigure,
  HeadlineFigureSkeleton,
} from "@/app/admin/_components/headline-figure";
import { HeadlineStrip } from "@/app/admin/_components/headline-strip";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";

const COUNTERS: {
  key: keyof GetTestimonialFunnelOutput;
  label: string;
  hint: string;
}[] = [
  { key: "requestsSent", label: "Requests sent", hint: "First email sent" },
  {
    key: "remindersSent",
    label: "Reminders sent",
    hint: "Follow-up sent a week later",
  },
  { key: "submitted", label: "Submitted", hint: "Testimonial received" },
  { key: "declined", label: "Declined", hint: "Asked not to be asked again" },
  { key: "expired", label: "Expired", hint: "No answer within 30 days" },
];

export function TestimonialFunnel() {
  const trpc = useTRPC();
  const funnelQuery = useQuery(
    trpc.admin.testimonials.getFunnel.queryOptions(),
  );

  return matchQueryStatus(funnelQuery, {
    Loading: (
      <HeadlineStrip columns={5}>
        {COUNTERS.map(({ key, label }) => (
          <HeadlineFigureSkeleton key={key} label={label} />
        ))}
      </HeadlineStrip>
    ),
    Errored: (error) => (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load the request funnel</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Empty: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No funnel figures</EmptyTitle>
          <EmptyDescription>No request counts were returned.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Success: ({ data }) => (
      <HeadlineStrip columns={5}>
        {COUNTERS.map(({ key, label, hint }) => (
          <HeadlineFigure
            key={key}
            label={label}
            value={String(data[key])}
            hint={hint}
          />
        ))}
      </HeadlineStrip>
    ),
  });
}
