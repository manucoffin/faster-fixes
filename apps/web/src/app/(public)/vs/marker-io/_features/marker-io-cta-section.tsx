import { VsActions } from "../../_features/vs-actions";
import { VsCtaSection } from "../../_features/vs-cta-section";

export function MarkerIoCtaSection() {
  return (
    <VsCtaSection
      title="Ready to switch from Marker.io?"
      body="Try FasterFixes free: no time limit, no credit card. Self-host for full infrastructure control or use the hosted version."
      actions={
        <VsActions
          signupLabel="Try FasterFixes free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
