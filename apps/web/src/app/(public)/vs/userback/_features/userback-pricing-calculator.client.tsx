"use client";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { Slider } from "@workspace/ui/components/slider";
import { useState } from "react";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice as formatCompetitorPrice,
} from "../../../_helpers/format-competitor-price";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const MAX_TEAM = 50;
const MAX_PROJECTS = 50;
const {
  team: teamPlan,
  business,
  businessPlus,
} = COMPETITOR_PRICES.userback.plans;
const { extraSeat, extraSeatBilledYearly } =
  COMPETITOR_PRICES.userback.otherPrices;
// Userback monthly billing: a plan price covers a bundle of seats and sites,
// extra seats are charged on Business and Business Plus.
const USERBACK_EXTRA_SEAT_PRICE = extraSeat.amount;
const USERBACK_BUSINESS = {
  label: business.name,
  price: business.amount,
  seats: business.seats,
  sites: business.projects,
};
const USERBACK_BUSINESS_PLUS = {
  label: businessPlus.name,
  price: businessPlus.amount,
  seats: businessPlus.seats,
  sites: businessPlus.projects,
};

type PlanResult = {
  planLabel: string;
  monthly: number | null;
  annual: number | null;
  note?: string;
};

function pickFasterFixesPlan(team: number, projects: number): PlanResult {
  if (team <= 1 && projects <= 1) {
    return { planLabel: "Free", monthly: 0, annual: 0 };
  }
  if (team <= proPlan.seats && projects <= proPlan.projects) {
    return { planLabel: "Pro", monthly: proPrice, annual: proPrice * 12 };
  }
  return {
    planLabel: "Agency",
    monthly: agencyPrice,
    annual: agencyPrice * 12,
  };
}

function pickUserbackPlan(team: number, projects: number): PlanResult {
  const plan =
    projects <= USERBACK_BUSINESS.sites
      ? USERBACK_BUSINESS
      : USERBACK_BUSINESS_PLUS;
  const extraSeats = Math.max(0, team - plan.seats);
  const monthly = plan.price + extraSeats * USERBACK_EXTRA_SEAT_PRICE;
  return {
    planLabel:
      extraSeats > 0
        ? `${plan.label} + ${extraSeats} extra ${extraSeats === 1 ? "seat" : "seats"}`
        : plan.label,
    monthly,
    annual: monthly * 12,
  };
}

function formatPrice(value: number | null): string {
  if (value === null) return "Custom";
  return `$${value.toLocaleString("en-US")}`;
}

function formatSavings(userback: PlanResult, fasterFixes: PlanResult) {
  if (userback.annual === null || fasterFixes.annual === null) {
    return "Compare with FasterFixes Agency";
  }
  const diff = userback.annual - fasterFixes.annual;
  if (diff <= 0) return null;
  return `Save $${diff.toLocaleString("en-US")} per year`;
}

export function UserbackPricingCalculator() {
  const [team, setTeam] = useState(5);
  const [projects, setProjects] = useState(3);

  const fasterFixesHosted = pickFasterFixesPlan(team, projects);
  const userback = pickUserbackPlan(team, projects);
  const hostedSavings = formatSavings(userback, fasterFixesHosted);
  const selfHostedSavings =
    userback.annual !== null
      ? `Save $${userback.annual.toLocaleString("en-US")} per year`
      : "Save the full Userback subscription";

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:gap-12 md:p-8">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <label htmlFor="team-slider" className="text-sm font-medium">
              Team members
            </label>
            <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {team}
            </span>
          </div>
          <Slider
            id="team-slider"
            min={1}
            max={MAX_TEAM}
            step={1}
            value={[team]}
            onValueChange={(values) => setTeam(values[0] ?? 1)}
            aria-label="Team members"
          />
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <label htmlFor="projects-slider" className="text-sm font-medium">
              Active projects
            </label>
            <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {projects}
            </span>
          </div>
          <Slider
            id="projects-slider"
            min={1}
            max={MAX_PROJECTS}
            step={1}
            value={[projects]}
            onValueChange={(values) => setProjects(values[0] ?? 1)}
            aria-label="Active projects"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y border-t md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-6 md:p-8">
          <p className="text-sm font-medium">Userback</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {userback.planLabel}
          </p>
          <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
            {formatPrice(userback.monthly)}
            {userback.monthly !== null && (
              <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {userback.annual !== null
              ? `${formatPrice(userback.annual)}/year`
              : userback.note}
          </p>
        </div>

        <div className="bg-muted/30 p-6 md:p-8">
          <p className="text-sm font-medium">FasterFixes hosted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fasterFixesHosted.planLabel}
          </p>
          <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
            {formatPrice(fasterFixesHosted.monthly)}
            <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">
              /mo
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {formatPrice(fasterFixesHosted.annual)}/year
          </p>
          {hostedSavings && (
            <p className="mt-4 text-sm font-medium text-success tabular-nums">
              {hostedSavings}
            </p>
          )}
        </div>

        <div className="p-6 md:p-8">
          <p className="text-sm font-medium">FasterFixes self-hosted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open source · AGPL-3.0
          </p>
          <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
            $0
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Infrastructure costs only
          </p>
          <p className="mt-4 text-sm font-medium text-success tabular-nums">
            {selfHostedSavings}
          </p>
        </div>
      </div>

      <p className="border-t bg-muted/30 px-6 py-4 text-xs leading-relaxed text-muted-foreground md:px-8">
        Calculation uses Userback Business, the closest equivalent to
        FasterFixes for structured bug reporting:{" "}
        {formatCompetitorPrice(business)}/month for {business.seats} seats and{" "}
        {business.projects} sites, plus {formatCompetitorPrice(extraSeat)}
        /month per extra seat. Above {business.projects} projects it uses{" "}
        {businessPlus.name}: {formatCompetitorPrice(businessPlus)}/month for{" "}
        {businessPlus.seats} seats and {businessPlus.projects} sites. The
        cheaper {teamPlan.name} plan ({formatCompetitorPrice(teamPlan)}/month
        for {teamPlan.seats} seats) omits console logs, network capture, session
        replay, and surveys. Annual savings are calculated against Userback
        monthly billing; annual billing brings {business.name} to{" "}
        {formatAmount(business.billedYearlyAmount, business.currency)}/month and
        extra seats to {formatCompetitorPrice(extraSeatBilledYearly)}/month.
        Check userback.io/pricing for current rates.
      </p>
    </div>
  );
}
