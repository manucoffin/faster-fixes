import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsPricingCard,
  VsPricingCards,
} from "../../_features/vs-pricing-cards";
import { VsSection } from "../../_features/vs-section";
import { SectionBody } from "../../../features/_components/section-body";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const cards: VsPricingCard[] = [
  {
    vendor: "FasterFixes · Self-hosted",
    plan: "Open source under AGPL-3.0",
    price: "$0",
    suffix: "/ month, forever",
    note: "Clone the repo, deploy on infrastructure you already pay for, and you owe us nothing. Same product as the hosted version.",
    highlight: true,
  },
  {
    vendor: "FasterFixes · Hosted",
    plan: `Pro plan, up to ${proPlan.seats} members`,
    price: `$${proPrice}`,
    suffix: "/ month",
    note: `Flat rate. Agency tier unlocks unlimited members at $${agencyPrice}/month. No per-seat charges as your team grows.`,
  },
  {
    vendor: "Usersnap · Professional",
    plan: "Cloud-only, closed source",
    price: "€219",
    suffix: "/ month",
    note: "Unlimited seats, 20 projects, 1,000,000 page views (each widget load counts), surveys, public roadmaps, two-way Jira, Linear, Asana and Azure DevOps sync. Starter is €49/mo for 2 seats and 2 projects; Premium is €459/mo.",
  },
];

export function UsersnapPricingSection() {
  return (
    <VsSection eyebrow="Pricing" title="How much Usersnap really costs">
      <SectionBody className="max-w-3xl">
        <p>
          Usersnap does not charge per seat beyond Starter. It charges per
          project: Starter €49/mo covers 2 seats and 2 projects, then every
          higher tier has unlimited seats and is sized by projects: Growth
          €129/mo (10 projects), Professional €219/mo (20 projects) and Premium
          €459/mo (50 projects). A five-person team pays €129/mo on Growth.
          Usersnap lists its prices in EUR, and yearly billing saves up to 3
          months. There is no free plan, only a free trial.
        </p>
        <p>
          FasterFixes is open source, so the lowest plan in any honest
          comparison is &quot;free, forever, on your own server.&quot; If you
          would rather not run it yourself, the hosted plans are flat-rate: $
          {proPrice}/mo for Pro and ${agencyPrice}/mo for Agency.
        </p>
      </SectionBody>

      <div className="mt-12 md:mt-16">
        <VsPricingCards cards={cards} />
      </div>

      <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <VsActions
          signupLabel="Start hosted, free"
          githubLabel="Self-host from GitHub"
        />
        <p className="max-w-md text-sm text-muted-foreground md:text-right">
          Usersnap pricing is based on publicly available information and may
          change. Check their site for current rates.
        </p>
      </div>
    </VsSection>
  );
}
