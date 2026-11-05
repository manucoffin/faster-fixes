"use client";

import {
  formatVideoUsageLine,
  isVideoUsageAtLimit,
} from "@/app/_domains/video/_helpers/format-video-usage";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type VideoUsageLineProps = {
  projectId: string;
};

// Renders nothing until the usage is known, on error and off cloud: the line
// is informative, and the upload itself re-checks the quota.
export function VideoUsageLine({ projectId }: VideoUsageLineProps) {
  const trpc = useTRPC();

  const { data: usage } = useQuery(
    trpc.authenticated.projects.video.getUsage.queryOptions({ projectId }),
  );

  if (!usage?.isCloud) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {formatVideoUsageLine(usage)}
      {isVideoUsageAtLimit(usage) && (
        <>
          .{" "}
          <Link
            href="/account/billing"
            className="text-foreground underline underline-offset-4"
          >
            Billing
          </Link>
        </>
      )}
    </p>
  );
}
