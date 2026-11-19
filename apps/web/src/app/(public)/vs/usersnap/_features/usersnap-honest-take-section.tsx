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

export function UsersnapHonestTakeSection() {
  return (
    <VsSection
      eyebrow="Honest take"
      title="Usersnap is the better choice for some teams"
    >
      <VsHonestTake
        competitor={{
          lead: "This is a direct comparison, not a sales pitch. Usersnap has a significantly richer feature set for non-developer use cases. FasterFixes and Usersnap solve overlapping problems in meaningfully different ways.",
          items: [
            {
              key: "surveys",
              content: (
                <>
                  <strong>NPS surveys and microsurveys</strong>: Usersnap
                  supports NPS, CSAT, and in-app microsurveys out of the box.
                  FasterFixes has no survey tooling.
                </>
              ),
            },
            {
              key: "feature-boards",
              content: (
                <>
                  <strong>Feature request boards</strong>: built-in public
                  roadmap and voting for product teams. FasterFixes does not
                  support this.
                </>
              ),
            },
            {
              key: "ai",
              content: (
                <>
                  <strong>AI feedback analysis</strong>: topic classification,
                  sentiment analysis, and an AI chat over your feedback, plus an
                  MCP server that brings it into Claude or ChatGPT. Scope varies
                  by plan.
                </>
              ),
            },
            {
              key: "browser-extension",
              content: (
                <>
                  <strong>Browser extension</strong>: lets non-technical
                  reporters submit feedback on any site without installing a
                  widget. FasterFixes needs its script tag or React package
                  installed on the site.
                </>
              ),
            },
            {
              key: "integrations",
              content: (
                <>
                  <strong>Integration breadth</strong>: Jira, Slack, Zendesk,
                  Azure DevOps, and 50+ other tools. FasterFixes ships GitHub,
                  Linear, and Jira two-way sync; more integrations are in
                  progress.
                </>
              ),
            },
            {
              key: "enterprise",
              content: (
                <>
                  <strong>Enterprise polish</strong>: custom branding, SSO, and
                  dedicated account management on enterprise plans.
                </>
              ),
            },
          ],
        }}
        fasterFixes={{
          lead: "If your workflow centers on product feedback, customer satisfaction, NPS tracking, or non-technical client reporting, Usersnap is the more complete tool today. FasterFixes is built for a narrower brief, and we think it is the right brief for most developer teams shipping client websites:",
          items: [
            {
              key: "self-host",
              content: (
                <>
                  <strong>Self-host on your own stack</strong>: full deployment
                  on Next.js, Postgres, Inngest, R2/S3. Usersnap has no
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
              key: "pricing",
              content: (
                <>
                  <strong>Flat pricing</strong>: ${proPrice}/month for a
                  5-person team versus $159/month on Usersnap Growth ($129/month
                  billed annually), since Starter includes 2 seats. The free
                  plan covers {freePlan.projects} project, {freeFeedbackLimit}{" "}
                  feedback items, and {freePlan.seats} member at no cost, with
                  no time limit. Usersnap offers a free trial, not a permanent
                  free tier.
                </>
              ),
            },
          ],
        }}
        verdict={
          <p>
            FasterFixes is a younger product. It does not match Usersnap&apos;s
            survey tooling, integration breadth, or enterprise features. What it
            offers instead is full code ownership, a self-hosted deployment
            path, and a developer workflow no closed-source SaaS can replicate.
          </p>
        }
      />
    </VsSection>
  );
}
