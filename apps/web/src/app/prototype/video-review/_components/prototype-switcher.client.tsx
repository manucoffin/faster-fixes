"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  REVIEW_PAGE_STATES,
  VARIANT_KEYS,
  type ReviewPageState,
  type VariantKey,
} from "../_features/prototype-options";

type PrototypeSwitcherProps = {
  variant: VariantKey;
  variantName: string;
  state: ReviewPageState;
  reviewerName: string | null;
  onForgetReviewer: () => void;
  onResetData: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

// The floating bar is not part of the design under review: high contrast,
// pinned to the bottom, hidden from a production build.
export function PrototypeSwitcher({
  variant,
  variantName,
  state,
  reviewerName,
  onForgetReviewer,
  onResetData,
}: PrototypeSwitcherProps) {
  const router = useRouter();

  function navigate(nextVariant: VariantKey, nextState: ReviewPageState) {
    router.replace(`?variant=${nextVariant}&state=${nextState}`);
  }

  function cycle(step: 1 | -1) {
    const index = VARIANT_KEYS.indexOf(variant);
    const next =
      VARIANT_KEYS[(index + step + VARIANT_KEYS.length) % VARIANT_KEYS.length];
    if (next) navigate(next, state);
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border-2 border-dashed border-amber-400 bg-amber-100 px-2 py-1 text-xs whitespace-nowrap text-amber-950 shadow-xl">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7 rounded-full hover:bg-amber-200"
        onClick={() => cycle(-1)}
        aria-label="Previous variant"
      >
        <ChevronLeft />
      </Button>
      <span className="font-mono font-semibold">
        {variant}
        <span className="hidden sm:inline"> ({variantName})</span>
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7 rounded-full hover:bg-amber-200"
        onClick={() => cycle(1)}
        aria-label="Next variant"
      >
        <ChevronRight />
      </Button>
      <select
        className="hidden rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 font-mono sm:block"
        value={state}
        onChange={(event) =>
          navigate(variant, event.target.value as ReviewPageState)
        }
        aria-label="Page state"
      >
        {REVIEW_PAGE_STATES.map((option) => (
          <option key={option} value={option}>
            state: {option}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="hidden rounded-full px-2 py-0.5 underline-offset-2 hover:underline disabled:opacity-50 sm:block"
        onClick={onForgetReviewer}
        disabled={reviewerName === null}
      >
        {reviewerName ? `forget "${reviewerName}"` : "no name yet"}
      </button>
      <button
        type="button"
        className="hidden rounded-full px-2 py-0.5 underline-offset-2 hover:underline sm:block"
        onClick={onResetData}
      >
        reset data
      </button>
    </div>
  );
}
