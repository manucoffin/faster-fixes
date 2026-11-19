import { VsHonestTake } from "../../_features/vs-honest-take";
import { VsSection } from "../../_features/vs-section";

const userbackWins = [
  "You need screen-recorded video feedback or session analytics across whole visits.",
  "You run NPS, CSAT, or in-app microsurveys.",
  "You want a public feature request portal with voting.",
  "You need SOC 2 Type II compliance or SSO available today.",
  "You want a mature integration roster (ClickUp 2-way sync, Zapier).",
];

export function UserbackHonestTakeSection() {
  return (
    <VsSection
      eyebrow="Honest take"
      title="Userback is the better choice for some teams"
    >
      <VsHonestTake
        competitor={{
          lead: "FasterFixes is narrower by design. If any of the points below describe your workflow, Userback is the more complete fit today.",
          items: userbackWins.map((point) => ({ key: point, content: point })),
        }}
      />
    </VsSection>
  );
}
