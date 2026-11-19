import Link from "next/link";
import { VsHonestTake } from "../../_features/vs-honest-take";
import { VsSection } from "../../_features/vs-section";

export function BugherdHonestTakeSection() {
  return (
    <VsSection
      eyebrow="Honest take"
      title="BugHerd is the better choice for some teams"
      tone="muted"
    >
      <VsHonestTake
        competitor={{
          lead: "BugHerd is a deep, mature product. It has real strengths FasterFixes does not match today:",
          items: [
            {
              key: "chrome-extension",
              content: (
                <>
                  <strong>Chrome extension</strong>: install once and review
                  feedback on any client site without touching their code.
                  FasterFixes needs its script tag or React package installed on
                  the site.
                </>
              ),
            },
            {
              key: "integrations",
              content: (
                <>
                  <strong>20+ project-management integrations</strong>: Jira,
                  Asana, ClickUp, Monday.com, Linear, Trello, Teamwork, and
                  more, with deep two-way sync. Jira, Linear, Asana, ClickUp,
                  Monday.com and Teamwork require Premium or above.
                </>
              ),
            },
            {
              key: "feedback-surface",
              content: (
                <>
                  <strong>Richer feedback surface</strong>: screen-recorded
                  video feedback, feedback on Figma designs, PDFs, and images.
                </>
              ),
            },
            {
              key: "enterprise",
              content: (
                <>
                  <strong>Enterprise polish</strong>: custom branding, SSO,
                  dedicated success manager, 99.9% uptime SLA.
                </>
              ),
            },
          ],
        }}
        fasterFixes={{
          lead: "If you need that breadth, BugHerd is the better fit. FasterFixes is built for a narrower brief, and we think it is the right brief for most developer teams shipping client websites:",
          items: [
            {
              key: "widget",
              content:
                "A frictionless feedback widget your clients use without an account.",
            },
            {
              key: "agent",
              content: (
                <>
                  <strong>Bring your own AI agent</strong>: the MCP server lets
                  Claude Code, Cursor, or Codex fetch and resolve feedback from
                  your editor with the model you choose.
                </>
              ),
            },
            {
              key: "any-stack",
              content: (
                <>
                  <strong>One widget, any stack</strong>: a drop-in script tag
                  on any site, or a React package for React apps. On React
                  sites, every report also carries the component path.
                </>
              ),
            },
            {
              key: "video-review",
              content: (
                <>
                  <strong>Video review</strong>: upload a video, share its link,
                  and clients leave timestamped feedback on it, on the same
                  board as site feedback.
                </>
              ),
            },
            {
              key: "infrastructure",
              content:
                "Full control of the infrastructure: self-host the dashboard, the API, the MCP server, and the storage.",
            },
          ],
        }}
        verdict={
          <>
            <p>
              <span className="text-foreground">
                If that matches what you actually need, FasterFixes is faster to
                adopt and cheaper to run.
              </span>{" "}
              If you need the breadth of BugHerd&apos;s project-management
              surface or a Chrome extension, pick BugHerd.
            </p>
            <p>
              If neither fits, compare the rest: our{" "}
              <Link href="/blog/bugherd-alternatives">
                9 BugHerd alternatives
              </Link>{" "}
              ranks them on real per-team pricing.
            </p>
          </>
        }
      />
    </VsSection>
  );
}
