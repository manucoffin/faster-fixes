import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { CheckIcon } from "lucide-react";
import { UsersnapMcpContrastAnimation } from "../_components/illustrations/usersnap-mcp-contrast-animation";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const tradeoffs: VsPoint[] = [
  {
    title: "Pricing scales with projects",
    body: `Usersnap is tiered by project count: Starter €49/mo (2 seats, 2 projects), then unlimited seats on Growth €129/mo (10 projects), Professional €219/mo (20 projects) and Premium €459/mo (50 projects). A third team member or project moves you off Starter, and each new batch of projects moves you up a tier. FasterFixes charges a flat $${proPrice}/mo for Pro (up to ${proPlan.seats} members) and $${agencyPrice}/mo for Agency with unlimited members and projects.`,
  },
  {
    title: "No self-hosting option",
    body: "Usersnap is SaaS-only: no self-hosted option, no public source code, no path to running it on your own infrastructure. FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3. Your feedback data stays on your servers.",
  },
  {
    title: "Built for product teams, not for the codebase",
    body: "Usersnap is designed for PMs and CX teams. It captures screenshots, screen recordings, browser metadata and console logs, but not the DOM selector of the element or the React component behind it. FasterFixes captures both on every Feedback, with no manual annotation.",
  },
  {
    title: "MCP built for product analysis, not fixes",
    body: "Usersnap's MCP connector lets Claude, ChatGPT, or Cursor search feedback, browse topics, and create and update opportunities. It cannot edit existing feedback, and its tool list does not mention screenshots or console data. The FasterFixes MCP server gives your coding agent each Feedback with its DOM selector, Screenshot, Recording timeline, and console and network logs, then lets it set the Status once the fix ships.",
  },
];

const fitPoints = [
  "You're a dev agency billing clients per project, not per seat.",
  "You want feedback piped directly into Claude Code, Cursor, or Codex via MCP.",
  "You need to self-host for data sovereignty or compliance.",
  "Your clients are non-technical and need a zero-account annotation widget.",
  "You ship sites on mixed stacks and want one widget for all of them.",
];

export function UsersnapFitSection() {
  return (
    <VsSection
      eyebrow="Fit"
      title="Is Usersnap a good fit for an enterprise product team?"
      intro="Yes, if your team runs surveys, public roadmaps and AI feedback analysis across many products. For a small dev team fixing client sites, the project tiers, the cloud-only hosting and the analysis-first MCP are the usual reasons to look elsewhere."
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <VsPointGrid points={tradeoffs} columns={1} />
        <div className="rounded-2xl bg-muted/50 p-4 sm:p-8 lg:sticky lg:top-24">
          <UsersnapMcpContrastAnimation />
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-medium tracking-tight">
          FasterFixes is the right fit if
        </h3>
        <ul className="mt-6 border-t">
          {fitPoints.map((point) => (
            <li key={point} className="flex items-start gap-4 border-b py-5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                <CheckIcon aria-hidden className="size-3.5 text-success" />
              </span>
              <span className="text-lg leading-relaxed text-pretty text-foreground">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </VsSection>
  );
}
