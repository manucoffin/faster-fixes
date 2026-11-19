import type { Route } from "next";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const capturedContext: VsPoint[] = [
  {
    title: "Screenshot",
    body: "The element they clicked, captured at that moment.",
  },
  {
    title: "Replay",
    body: "The last minute on the page, without the values typed into the fields.",
  },
  {
    title: "URL and DOM selector",
    body: "The page and the exact node.",
  },
  {
    title: "React component tree",
    body: "On React sites, the component behind the element.",
  },
  {
    title: "Browser and viewport",
    body: "What the client actually saw.",
  },
  {
    title: "Console logs and network requests",
    body: "The errors and calls running behind the screen.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
];

export function UsersnapEditorSection() {
  return (
    <VsSection
      eyebrow="Made for developers"
      title="What reaches your editor"
      intro="A client clicks the element that looks wrong and writes one sentence. No account, no extension, no call to explain what they meant. FasterFixes attaches everything a developer would otherwise ask for in one markdown report, which your agent reads through MCP in Claude Code or Cursor to find the code, fix it and set the Status."
      tone="muted"
    >
      <VsPointGrid points={capturedContext} />
    </VsSection>
  );
}
