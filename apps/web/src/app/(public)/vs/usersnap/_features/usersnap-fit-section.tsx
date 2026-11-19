import { VsFitSection } from "../../_features/vs-fit-section";

const fitPoints = [
  "You're a dev agency billing clients per project, not per seat.",
  "You want feedback piped directly into Claude Code, Cursor, or Codex via MCP.",
  "You need to self-host for data sovereignty or compliance.",
  "Your clients are non-technical and need a zero-account annotation widget.",
  "You ship sites on mixed stacks and want one widget for all of them, with a native package for React apps.",
];

export function UsersnapFitSection() {
  return (
    <VsFitSection
      eyebrow="Who it's for"
      title="FasterFixes is the right fit if"
      points={fitPoints}
      tone="muted"
    />
  );
}
