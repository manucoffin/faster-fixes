import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { MarkerIoTierGatingIllustration } from "../_components/illustrations/marker-io-tier-gating-illustration";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const limitations: VsPoint[] = [
  {
    title: "The bill grows every time you hire",
    body: `Marker.io charges per seat: Starter covers 3 members, Team covers 15, and every additional member is $4–$6/month on top with annual billing ($6–$9 monthly). A 5-person dev team that needs Jira and devtools already starts at $149/month annual before adding anyone. FasterFixes charges per workspace: $${proPrice}/month flat for up to ${proPlan.seats} members, $${agencyPrice}/month for unlimited. Headcount stops being a pricing variable.`,
  },
  {
    title: "No way to self-host or own your data",
    body: "Marker.io is SaaS-only: no self-hosted option, no public source code, no path to running it on your own infrastructure. This is the most-cited complaint in FOSS communities; the top result for the keyword is a Reddit thread literally titled “Looking for a self-hosted marker.io alternative.” FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3.",
  },
  {
    title: "Key features locked behind the $149/month tier",
    body: `On Marker.io Starter ($39/month annual), you do not get Jira sync, session replay, devtools (console and network logs), or custom branding. Those require Team at $149/month annual, a 3.8× jump. FasterFixes does not gate developer context by tier: React component tree capture, the Recording and MCP access are on every plan, including Free, and GitHub, Linear and Jira sync are included from Pro at $${proPrice}/month.`,
  },
  {
    title: "Built for QA reviewers, not the developer fixing the bug",
    body: "Marker.io's workflow is optimized for project managers and QA: feedback lands in a dashboard, gets triaged, and eventually reaches a developer as a ticket. There is no path from client annotation to the editor or terminal. FasterFixes routes feedback to where developers work: GitHub, Linear, and Jira issues via two-way sync, or the terminal via @fasterfixes/mcp, where Claude Code, Cursor, or Codex can read the report and open a fix without leaving the editor.",
  },
];

export function MarkerIoWhySwitchSection() {
  return (
    <VsSection
      eyebrow="Where Marker.io falls short"
      title="Why teams switch from Marker.io"
      className="border-t"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <VsPointGrid points={limitations} columns={1} />
        <div className="rounded-2xl bg-muted/50 p-4 sm:p-8 lg:sticky lg:top-24">
          <MarkerIoTierGatingIllustration />
        </div>
      </div>
    </VsSection>
  );
}
