import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { UsersnapMcpContrastAnimation } from "../_components/illustrations/usersnap-mcp-contrast-animation";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const limitations: VsPoint[] = [
  {
    title: "Pricing scales with projects",
    body: `Usersnap is tiered by project count: Starter $59/mo (2 seats, 2 projects), Growth $159/mo (10 projects), Professional $259/mo (20 projects), Premium $549/mo (50 projects). A third team member or project moves you off Starter, and each new batch of projects moves you up a tier. FasterFixes charges a flat $${proPrice}/mo for Pro (up to ${proPlan.seats} members) and $${agencyPrice}/mo for Agency with unlimited members and projects.`,
  },
  {
    title: "No self-hosting option",
    body: "Usersnap is SaaS-only: no self-hosted option, no public source code, no path to running it on your own infrastructure. FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3. Your feedback data stays on your servers.",
  },
  {
    title: "Not built for developers",
    body: "Usersnap is designed for PMs and CX teams. It captures screenshots, screen recordings, and browser metadata, but it does not know which React component was clicked, which DOM selector is involved, or what the viewport was. FasterFixes captures DOM selector, URL, browser, and viewport automatically on every feedback item, plus the component tree on React sites, no manual annotation required.",
  },
  {
    title: "MCP built for product analysis, not fixes",
    body: "Usersnap's MCP server lets Claude, ChatGPT, or Cursor search feedback, summarize topics, and create opportunities, but it cannot edit existing feedback and its documentation does not mention screenshots or console data. The FasterFixes MCP server gives your coding agent each Feedback with its DOM selector, Screenshot, Recording timeline, and console and network logs, then lets it set the Status once the fix ships.",
  },
];

export function UsersnapWhySwitchSection() {
  return (
    <VsSection
      eyebrow="Where Usersnap falls short"
      title="Why teams switch from Usersnap"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <VsPointGrid points={limitations} columns={1} />
        <div className="rounded-2xl bg-muted/50 p-4 sm:p-8 lg:sticky lg:top-24">
          <UsersnapMcpContrastAnimation />
        </div>
      </div>
    </VsSection>
  );
}
