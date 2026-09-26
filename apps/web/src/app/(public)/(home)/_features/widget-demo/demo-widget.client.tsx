"use client";

import { useEffect } from "react";
import { createWidget } from "@fasterfixes/widget/internal";
import { LocalStorageFeedbackClient } from "./local-storage-client";
import { TryMeHint } from "./try-me-hint.client";

const DEMO_REVIEWER_TOKEN = "demo";

export function DemoWidget() {
  useEffect(() => {
    const widget = createWidget({
      client: new LocalStorageFeedbackClient(),
      reviewerToken: DEMO_REVIEWER_TOKEN,
      config: { enabled: true, branding: false },
      position: "bottom-right",
    });
    return () => widget.destroy();
  }, []);

  return <TryMeHint />;
}
