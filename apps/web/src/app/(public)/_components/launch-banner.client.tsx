"use client";

import { cn } from "@workspace/ui/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

const TINYLAUNCH_URL = "https://www.tinylaunch.com/launch/15543";

// Bump this key to re-show the banner after a future launch/campaign.
const DISMISS_STORAGE_KEY = "launch-banner-tinylaunch-15543-dismissed";

// Launch window: 29 Jun 2026 09:00 Paris (CEST, UTC+2) through 6 Jul 2026
// 09:00 Paris. Stored as fixed UTC instants so the window is identical
// regardless of viewer timezone.
const WINDOW_START_MS = Date.UTC(2026, 5, 29, 7, 0, 0);
const WINDOW_END_MS = Date.UTC(2026, 6, 6, 7, 0, 0);

// Read once per render on the client; nothing notifies a change, and a
// dismissal in this tab is tracked in state instead.
function subscribeToNothing() {
  return () => {};
}

function getIsEligible() {
  const now = Date.now();
  const inWindow = now >= WINDOW_START_MS && now < WINDOW_END_MS;
  const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY) === "true";
  return inWindow && !dismissed;
}

// SSR and hydration render nothing; the banner appears only once the client
// confirms we're inside the launch window and localStorage holds no prior
// dismissal. Avoids a flash for users who already closed it or are off-window.
function getServerIsEligible() {
  return false;
}

export function LaunchBanner() {
  const isEligible = React.useSyncExternalStore(
    subscribeToNothing,
    getIsEligible,
    getServerIsEligible,
  );
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setIsDismissed(true);
  };

  if (!isEligible || isDismissed) {
    return null;
  }

  return (
    <div className="relative bg-primary text-primary-foreground">
      <div className="mx-auto flex items-center justify-center gap-2 px-10 py-4 text-center">
        <p>
          We&apos;re launching on TinyLaunch today. If you have 30 seconds, a{" "}
          <a
            href={TINYLAUNCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            vote
          </a>{" "}
          would mean a lot.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className={cn(
          "absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1",
          "opacity-80 transition-opacity hover:opacity-100",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50",
        )}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
