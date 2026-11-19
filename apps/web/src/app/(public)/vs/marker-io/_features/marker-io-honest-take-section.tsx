import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { VsHonestTake } from "../../_features/vs-honest-take";
import { VsSection } from "../../_features/vs-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;

export function MarkerIoHonestTakeSection() {
  return (
    <VsSection
      eyebrow="Honest take"
      title="Marker.io is the better choice for some teams"
      tone="muted"
    >
      <VsHonestTake
        competitor={{
          lead: "This is a direct comparison, not a sales pitch. FasterFixes and Marker.io solve overlapping problems in meaningfully different ways. Marker.io is a deeper, more mature product, and it has real strengths FasterFixes does not match today:",
          items: [
            {
              key: "browser-extension",
              content: (
                <>
                  <strong>Browser extension</strong>: Chrome, Firefox, and
                  Safari extensions let reviewers leave feedback on any site
                  without touching its code. FasterFixes needs its script tag or
                  React package installed on the site.
                </>
              ),
            },
            {
              key: "design-files",
              content: (
                <>
                  <strong>Feedback on Figma, PDFs, and images</strong>: annotate
                  static assets and design files. FasterFixes does not support
                  this.
                </>
              ),
            },
            {
              key: "integrations",
              content: (
                <>
                  <strong>Project-management integration breadth</strong>: Jira,
                  Linear, Asana, ClickUp, Trello, Monday.com, Notion, Basecamp,
                  Wrike, Shortcut, and more. FasterFixes ships GitHub, Linear,
                  and Jira two-way sync; more integrations are in progress.
                </>
              ),
            },
            {
              key: "guest-portal",
              content: (
                <>
                  <strong>Guest Portal</strong>: dedicated client-facing
                  communication hub. FasterFixes has a team kanban; a
                  client-facing board is on the roadmap, not yet shipped.
                </>
              ),
            },
            {
              key: "ai",
              content: (
                <>
                  <strong>In-dashboard AI features</strong>: AI Title
                  Generation, AI Magic Rewrite, AI Translation (beta).
                  FasterFixes has no in-dashboard AI features.
                </>
              ),
            },
            {
              key: "enterprise",
              content: (
                <>
                  <strong>Enterprise polish</strong>: SSO/SAML, audit logs,
                  sensitive-data masking, dedicated account manager on the
                  Business plan.
                </>
              ),
            },
          ],
        }}
        fasterFixes={{
          lead: "If your workflow centers on QA handoffs, client approvals, or design-file annotation, Marker.io is the more complete tool today. FasterFixes is built for a narrower brief, and we think it is the right brief for most developer teams shipping client websites:",
          items: [
            {
              key: "self-host",
              content: (
                <>
                  <strong>Self-host on your own stack</strong>: full deployment
                  on Next.js, Postgres, Inngest, R2/S3. Marker.io has no
                  self-hosted option.
                </>
              ),
            },
            {
              key: "open-source",
              content: (
                <>
                  <strong>Open-source under AGPL-3.0</strong>: the widget
                  packages are MIT. Audit, fork, or modify the code.
                </>
              ),
            },
            {
              key: "agent",
              content: (
                <>
                  <strong>Bring your own AI agent via MCP</strong>: Claude Code,
                  Cursor, Codex, or any MCP-compatible client. You pick the
                  model.
                </>
              ),
            },
            {
              key: "component-tree",
              content: (
                <>
                  <strong>React component tree capture</strong>: on React sites,
                  every report ships with the DOM selector and the React
                  component path. The agent knows which file owns the bug.
                </>
              ),
            },
            {
              key: "recording",
              content: (
                <>
                  <strong>Recording on every plan</strong>: each report carries
                  a Recording of the last minute on the page. Marker.io bundles
                  session replay on the Team plan and above.
                </>
              ),
            },
            {
              key: "pricing",
              content: (
                <>
                  <strong>Flat pricing</strong>: ${proPrice}/month for a
                  5-person team versus $149/month annual on Marker.io Team. The
                  free plan covers {freePlan.projects} project,{" "}
                  {freeFeedbackLimit} feedback items, and {freePlan.seats}{" "}
                  member at no cost.
                </>
              ),
            },
          ],
        }}
        verdict={
          <p>
            FasterFixes is a younger product. It does not match Marker.io&apos;s
            integration breadth, design-file annotation, or client portal. What
            it offers instead is full code ownership, a self-hosted deployment
            path, and a developer workflow no closed-source QA tool can
            replicate.
          </p>
        }
      />
    </VsSection>
  );
}
