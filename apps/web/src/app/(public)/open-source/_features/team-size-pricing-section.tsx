import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import Link from "next/link";

type PricedPlan = {
  name: string;
  price: number;
  seats: number;
};

const TEAM_SIZES = [3, 5, 10, 15] as const;

// Each list is ordered by price, so the first plan that fits is the cheapest.
const hostedPlans: PricedPlan[] = [
  {
    name: "Free",
    price: PLAN_PRICES[SubscriptionPlanName.Free],
    seats: PLAN_LIMITS[SubscriptionPlanName.Free].seats,
  },
  {
    name: "Pro",
    price: PLAN_PRICES[SubscriptionPlanName.Pro],
    seats: PLAN_LIMITS[SubscriptionPlanName.Pro].seats,
  },
  {
    name: "Agency",
    price: PLAN_PRICES[SubscriptionPlanName.Agency],
    seats: PLAN_LIMITS[SubscriptionPlanName.Agency].seats,
  },
];

// Monthly list prices and included seats, as published on the /vs pages.
const competitors: { vendor: string; plans: PricedPlan[] }[] = [
  {
    vendor: "BugHerd",
    plans: [
      { name: "Standard", price: 50, seats: 5 },
      { name: "Studio", price: 80, seats: 10 },
      { name: "Premium", price: 150, seats: 25 },
    ],
  },
  {
    vendor: "Marker.io",
    plans: [
      { name: "Starter", price: 59, seats: 3 },
      { name: "Team", price: 199, seats: 15 },
    ],
  },
  {
    vendor: "Usersnap",
    plans: [
      { name: "Starter", price: 49, seats: 5 },
      { name: "Growth", price: 109, seats: 10 },
      { name: "Professional", price: 199, seats: 20 },
      { name: "Premium", price: 319, seats: 50 },
    ],
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
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">${plan.price}</span>
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
                      plan={{ name: "Open source", price: 0, seats: teamSize }}
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
            Monthly billing in USD, at list prices published at time of writing.
            Annual billing lowers several competitor prices: Marker.io Starter
            and Usersnap Starter drop to $39 per month, BugHerd Standard to $42.
          </li>
          <li>
            Seat counts only. Project, page view and feedback limits differ by
            vendor. FasterFixes Pro covers up to{" "}
            {PLAN_LIMITS[SubscriptionPlanName.Pro].projects} projects, and
            Agency has no limit on projects, feedback or members.
          </li>
          <li>
            BugHerd sells extra members at $8 per month on top of a plan, which
            can lower some totals. Marker.io Starter includes 3 seats and
            excludes Jira sync and developer tools, so larger teams are priced
            on Team, which includes 15 seats.
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
