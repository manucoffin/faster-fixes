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

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const ruttlPro = COMPETITOR_PRICES.ruttl.plans.pro;
const teamSize = 5;
const ruttlTeamMonthly = ruttlPro.amount * teamSize;
const usd = (amount: number) => formatAmount(amount, "USD");

const cards = [
  {
    title: "Per-seat pricing that scales against you",
    body: `Ruttl Pro is ${formatPrice(ruttlPro)} per user per month. A ${teamSize}-person team pays ${usd(ruttlTeamMonthly)} a month, or ${usd(ruttlTeamMonthly * 12)} a year. The Business plan is custom-priced through sales. FasterFixes is flat: $${proPrice} a month hosted up to ${proPlan.seats} members, $0 self-hosted.`,
  },
  {
    title: "No self-hosting, no open-source option",
    body: "Ruttl is cloud-only. Annotated screenshots, client comments, and project metadata sit on their infrastructure. For EU agencies under GDPR, or any team that wants data sovereignty, there is no audit trail and no migration path. FasterFixes is AGPL-3.0; deploy it on your own stack.",
  },
  {
    title: "Chrome extension required for auth-gated sites",
    body: "Sites behind Basic Auth or staging passwords require the Ruttl Chrome extension. That removes mobile feedback from the workflow entirely on those projects: clients cannot annotate from a phone. FasterFixes runs as an in-page widget on every device the page supports.",
  },
  {
    title: "Shallow integrations, no AI agent support",
    body: "Ruttl integrations create links back to Ruttl rather than synced issue data. Feedback never enters your real tracker. There is no MCP server, no Claude Code or Cursor integration, no path to route annotated reports into an AI coding agent. FasterFixes ships with both.",
  },
];

export function RuttlWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Why switch
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Ruttl
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-xl border bg-muted/30 p-7">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
