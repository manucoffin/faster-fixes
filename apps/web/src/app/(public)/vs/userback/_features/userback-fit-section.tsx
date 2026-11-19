import { VsFitList } from "../../_features/vs-fit-list";
import { VsSection } from "../../_features/vs-section";

const fitPoints = [
  "You're a dev agency billing clients per project, not per seat.",
  "You want feedback piped directly into Claude Code, Cursor, or Codex via MCP.",
  "You need to self-host for data sovereignty or compliance.",
  "You don't need screen recording, session analytics, or NPS surveys.",
  "You want one widget for every client site: a script tag on any stack, or a React package for React apps.",
];

export function UserbackFitSection() {
  return (
    <VsSection
      eyebrow="Right fit"
      title="FasterFixes is the right fit if"
      tone="muted"
    >
      <VsFitList points={fitPoints} className="max-w-4xl" />
    </VsSection>
  );
}
