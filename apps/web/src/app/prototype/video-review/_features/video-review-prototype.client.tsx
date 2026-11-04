"use client";

import { LinkRevoked } from "../_components/link-revoked";
import { PrototypeSwitcher } from "../_components/prototype-switcher.client";
import { NamePromptDialog } from "./name-prompt-dialog.client";
import type { ReviewPageState, VariantKey } from "./prototype-options";
import { useVideoReview } from "./use-video-review";
import { VARIANT_A_NAME, VariantATheater } from "./variant-a-theater.client";
import { VARIANT_B_NAME, VariantBInbox } from "./variant-b-inbox.client";
import { VARIANT_C_NAME, VariantCPins } from "./variant-c-pins.client";

const VARIANTS = {
  A: { name: VARIANT_A_NAME, Component: VariantATheater },
  B: { name: VARIANT_B_NAME, Component: VariantBInbox },
  C: { name: VARIANT_C_NAME, Component: VariantCPins },
} as const;

type VideoReviewPrototypeProps = {
  variant: VariantKey;
  state: ReviewPageState;
};

// Review state lives here so it survives switching variants; each variant
// owns its own player and layout.
export function VideoReviewPrototype({
  variant,
  state,
}: VideoReviewPrototypeProps) {
  const review = useVideoReview();
  const { name, Component } = VARIANTS[variant];

  return (
    <>
      {state === "revoked" ? (
        <LinkRevoked />
      ) : (
        <Component review={review} readOnly={state === "closed"} />
      )}
      <NamePromptDialog
        prompt={review.namePrompt}
        onConfirm={review.claimName}
        onCancel={review.cancelNamePrompt}
      />
      <PrototypeSwitcher
        variant={variant}
        variantName={name}
        state={state}
        reviewerName={review.reviewerName}
        onForgetReviewer={review.forgetReviewer}
        onResetData={review.resetData}
      />
    </>
  );
}
