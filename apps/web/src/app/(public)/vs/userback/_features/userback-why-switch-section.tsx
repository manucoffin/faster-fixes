import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "../../../_helpers/format-competitor-price";
import { UserbackTierGatingIllustration } from "../_components/illustrations/userback-tier-gating-illustration";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const { business } = COMPETITOR_PRICES.userback.plans;
const limitations: VsPoint[] = [
  {
    title: "Developer context starts at Business",
    body: `Console logs, network requests, and session replay are not on Userback's Team plan. They start on ${business.name} at ${formatPrice(business)}/month (${formatAmount(business.billedYearlyAmount, business.currency)} billed annually), or ${formatAmount(business.amount * 12, business.currency)}/year on monthly billing, even for a 5-person team. FasterFixes Pro is $${proPrice}/month flat for up to ${proPlan.seats} members, with console and network capture included.`,
  },
  {
    title: "Cloud-only, no data sovereignty",
    body: "Userback is cloud-only and closed source. There is no self-hosting option and no way to inspect the codebase. FasterFixes runs on your own infrastructure: Next.js, Postgres, Inngest, and R2/S3. Deploy on Vercel, Railway, or any Node host. Client feedback never leaves your environment.",
  },
  {
    title: "Not built for developer workflows",
    body: "Userback captures screenshots, video, and session replay, useful for product managers and end-user feedback. FasterFixes captures React component tree, DOM selector, URL, browser, and viewport automatically, and attaches a Recording of the last minute on the page. Every feedback item arrives with the structured technical context a developer needs to act immediately.",
  },
  {
    title: "Built for product teams, not dev agencies",
    body: "Userback ships a feature portal, NPS/CSAT/CES surveys, user segmentation, and a public roadmap. These are powerful for SaaS product teams collecting end-user feedback at scale. If you are a dev agency delivering client projects, you are paying for a feature set you will not use.",
  },
];

export function UserbackWhySwitchSection() {
  return (
    <VsSection
      eyebrow="Where Userback falls short"
      title="Why teams switch from Userback"
      tone="muted"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <VsPointGrid points={limitations} columns={1} />
        <div className="rounded-2xl bg-background p-4 sm:p-8 lg:sticky lg:top-24">
          <UserbackTierGatingIllustration />
        </div>
      </div>
    </VsSection>
  );
}
