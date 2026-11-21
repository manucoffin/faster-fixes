import { VsHonestTake } from "../../_features/vs-honest-take";
import { VsSection } from "../../_features/vs-section";

const userbackWins = [
  "You need screen-recorded video feedback or session analytics across whole visits.",
  "You run NPS, CSAT, or in-app microsurveys.",
  "You want a public feature request portal with voting.",
  "You need SOC 2 Type II compliance or SSO available today.",
  "You rely on ClickUp two-way sync or Zapier.",
];

export function UserbackHonestTakeSection() {
  return (
    <VsSection
      eyebrow="Honest take"
      title="When to stay on Userback"
      tone="muted"
    >
      <VsHonestTake
        competitor={{
          lead: "FasterFixes is narrower by design. If any of these describe your team, Userback is the better fit today.",
          items: userbackWins.map((point) => ({ key: point, content: point })),
        }}
      />
    </VsSection>
  );
}
