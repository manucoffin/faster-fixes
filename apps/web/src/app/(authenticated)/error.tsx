"use client";

import { ErrorScreen } from "@/app/_components/error-screen";
import { ERROR_BOUNDARY_COPY } from "@/app/_constants/error-screens";
import { Button } from "@workspace/ui/components/button";
import { useEffect } from "react";

// `digest` is left out on purpose: the boundary logs the error object and
// renders none of its fields, so nothing here can leak internals.
type AuthenticatedErrorBoundaryProps = {
  error: Error;
  retry: () => void;
};

// Sits inside the authenticated layout, so the sidebar and the header survive a
// render error and the user can navigate away instead of reloading.
export default function AuthenticatedErrorBoundary({
  error,
  retry,
}: AuthenticatedErrorBoundaryProps) {
  useEffect(() => {
    console.error("Authenticated render error", error);
  }, [error]);

  return (
    <ErrorScreen
      title={ERROR_BOUNDARY_COPY.title}
      description={ERROR_BOUNDARY_COPY.description}
      className="min-h-[50vh]"
    >
      <Button onClick={() => retry()}>{ERROR_BOUNDARY_COPY.retryLabel}</Button>
    </ErrorScreen>
  );
}
