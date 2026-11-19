import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import type { Currency } from "@/app/(public)/_helpers/competitor-prices";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  EXCHANGE_RATE_NOTE,
  formatAmount,
  formatUsdEquivalent,
} from "@/app/(public)/_helpers/format-competitor-price";
import Link from "next/link";

type PricedPlan = {
  name: string;
  amount: number;
  currency: Currency;
  seats: number;
};

const TEAM_SIZES = [3, 5, 10, 15] as const;

// Each list is ordered by price, so the first plan that fits is the cheapest.
const hostedPlans: PricedPlan[] = [
  {
    name: "Free",
    amount: PLAN_PRICES[SubscriptionPlanName.Free],
    currency: "USD",
    seats: PLAN_LIMITS[SubscriptionPlanName.Free].seats,
  },
  {
    name: "Pro",
    amount: PLAN_PRICES[SubscriptionPlanName.Pro],
    currency: "USD",
    seats: PLAN_LIMITS[SubscriptionPlanName.Pro].seats,
  },
  {
    name: "Agency",
    amount: PLAN_PRICES[SubscriptionPlanName.Agency],
    currency: "USD",
    seats: PLAN_LIMITS[SubscriptionPlanName.Agency].seats,
  },
];

const { bugherd, markerIo, usersnap } = COMPETITOR_PRICES;

// Monthly list prices and included seats, each in the vendor's own currency.
const competitors: { vendor: string; plans: PricedPlan[] }[] = [
  {
    vendor: "BugHerd",
    plans: [
      bugherd.plans.standard,
      bugherd.plans.studio,
      bugherd.plans.premium,
    ],
  },
  { vendor: "Marker.io", plans: [markerIo.plans.starter, markerIo.plans.team] },
  {
    vendor: "Usersnap",
    plans: [usersnap.plans.starter, usersnap.plans.growth],
  },
];

function findPlan(plans: PricedPlan[], teamSize: number) {
  return plans.find((plan) => plan.seats >= teamSize);
}

type PriceCellProps = {
  plan: PricedPlan | undefined;
};

function PriceCell({ plan }: PriceCellProps) {
  if (!plan) {
    return <span className="text-sm text-muted-foreground">Custom</span>;
  }
  const equivalent = formatUsdEquivalent(plan);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">
        {formatAmount(plan.amount, plan.currency)}
      </span>
      {equivalent && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {equivalent}
        </span>
      )}
      <span className="text-xs text-muted-foreground">{plan.name}</span>
    </div>
  );
}

const headers = [
  "FasterFixes self-hosted",
  "FasterFixes hosted",
  ...competitors.map((competitor) => competitor.vendor),
];

export function TeamSizePricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Monthly cost by team size
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            FasterFixes charges a flat price per organization, not per seat, and
            self-hosting has no license fee. The table shows the monthly price
            of each tool&apos;s lowest plan that includes every member of the
            team.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left text-sm font-semibold" scope="col">
                  Team size
                </th>
                {headers.map((header, i) => (
                  <th
                    key={header}
                    scope="col"
                    className={`p-4 text-left text-sm font-semibold ${
                      i < 2 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAM_SIZES.map((teamSize) => (
                <tr key={teamSize} className="border-b last:border-b-0">
                  <th
                    scope="row"
                    className="p-4 text-left align-top text-sm font-medium"
                  >
                    {teamSize} members
                  </th>
                  <td className="p-4 align-top">
                    <PriceCell
                      plan={{
                        name: "Open source",
                        amount: 0,
                        currency: "USD",
                        seats: teamSize,
                      }}
                    />
                  </td>
                  <td className="p-4 align-top">
                    <PriceCell plan={findPlan(hostedPlans, teamSize)} />
                  </td>
                  {competitors.map((competitor) => (
                    <td key={competitor.vendor} className="p-4 align-top">
                      <PriceCell plan={findPlan(competitor.plans, teamSize)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mx-auto mt-8 flex max-w-2xl list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            Monthly billing at list prices published at time of writing, in USD
            except Usersnap, which lists EUR prices only. Annual billing lowers
            several competitor prices: Marker.io Starter drops to{" "}
            {formatAmount(
              markerIo.plans.starter.billedYearlyAmount,
              markerIo.plans.starter.currency,
            )}{" "}
            per month and BugHerd Standard to{" "}
            {formatAmount(
              bugherd.plans.standard.billedYearlyAmount,
              bugherd.plans.standard.currency,
            )}
            . Usersnap says yearly billing saves up to{" "}
            {usersnap.yearlySavesUpToMonths} months. {EXCHANGE_RATE_NOTE}
          </li>
          <li>
            Seat counts only. Project, page view and feedback limits differ by
            vendor. FasterFixes Pro covers up to{" "}
            {PLAN_LIMITS[SubscriptionPlanName.Pro].projects} projects, and
            Agency has no limit on projects, feedback or members.
          </li>
          <li>
            BugHerd sells extra members at{" "}
            {formatAmount(
              bugherd.otherPrices.extraSeat.amount,
              bugherd.otherPrices.extraSeat.currency,
            )}{" "}
            per month on top of a plan, which can lower some totals. Marker.io
            Starter includes {markerIo.plans.starter.seats} seats and excludes
            Jira sync and developer tools, so larger teams are priced on Team,
            which includes {markerIo.plans.team.seats} seats.
          </li>
          <li>
            The self-hosted column excludes your own hosting, database, storage
            and email costs.
          </li>
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          See{" "}
          <Link
            href="/pricing"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            FasterFixes pricing
          </Link>{" "}
          for every plan, or the detailed comparisons with{" "}
          <Link
            href="/vs/bugherd"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            BugHerd
          </Link>
          ,{" "}
          <Link
            href="/vs/marker-io"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Marker.io
          </Link>{" "}
          and{" "}
          <Link
            href="/vs/usersnap"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Usersnap
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
