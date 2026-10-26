"use client";

import { FeedbackProvider } from "@fasterfixes/react";
import type { ReactNode } from "react";

type AppFeedbackProviderProps = {
  children: ReactNode;
};

// Read at each submission, so a theme switched after init is the one reported.
// The end-to-end suite flips the `dark` class to prove the value is fresh.
function readCustomMetadata() {
  return {
    app: "web",
    colorScheme: document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  };
}

export function AppFeedbackProvider({ children }: AppFeedbackProviderProps) {
  return (
    <FeedbackProvider
      projectId={process.env.NEXT_PUBLIC_FF_API_KEY ?? ""}
      apiOrigin={process.env.NEXT_PUBLIC_FF_API_ORIGIN}
      position="bottom-right"
      captureDiagnostics={true}
      customMetadata={readCustomMetadata}
    >
      {children}
    </FeedbackProvider>
  );
}
