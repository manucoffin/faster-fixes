import { VsActions } from "../../_features/vs-actions";
import { VsCtaSection } from "../../_features/vs-cta-section";

export function BugherdCtaSection() {
  return (
    <VsCtaSection
      title="Ready to switch from BugHerd?"
      body="Try FasterFixes free: no credit card, no per-seat pricing. Self-host on your own stack or use the hosted version."
      actions={
        <VsActions
          signupLabel="Try FasterFixes free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
