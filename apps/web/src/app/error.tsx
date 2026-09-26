"use client";

import { ErrorScreen } from "@/app/_components/error-screen";
import { ERROR_BOUNDARY_COPY } from "@/app/_constants/error-screens";
import { Button } from "@workspace/ui/components/button";
import { useEffect } from "react";

// `digest` is left out on purpose: the boundary logs the error object and
// renders none of its fields, so nothing here can leak internals.
type RootErrorBoundaryProps = {
  error: Error;
  retry: () => void;
};

export default function RootErrorBoundary({
  error,
  retry,
}: RootErrorBoundaryProps) {
  // The only place the raw error is read: the screen itself shows fixed copy.
  useEffect(() => {
    console.error("Root render error", error);
  }, [error]);

  // The root boundary replaces every nested layout, so it carries the page
  // landmark itself.
  return (
    <main className="flex flex-1 flex-col">
      <ErrorScreen
        title={ERROR_BOUNDARY_COPY.title}
        description={ERROR_BOUNDARY_COPY.description}
      >
        <Button onClick={() => retry()}>
          {ERROR_BOUNDARY_COPY.retryLabel}
        </Button>
      </ErrorScreen>
    </main>
  );
}
