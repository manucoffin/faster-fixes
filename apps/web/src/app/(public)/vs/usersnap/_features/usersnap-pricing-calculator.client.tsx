"use client";

import { Slider } from "@workspace/ui/components/slider";
import { useState } from "react";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";

import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  EXCHANGE_RATE_NOTE,
  formatAmount,
  formatUsdEquivalent,
  toUsd,
} from "@/app/(public)/_helpers/format-competitor-price";

const MAX_TEAM = 50;
const MAX_PROJECTS = 50;

const { starter, growth, professional, premium } =
  COMPETITOR_PRICES.usersnap.plans;

// Ordered by price, so the first tier that fits is the cheapest.
const USERSNAP_TIERS = [starter, growth, professional, premium];

const HOSTED_PLANS = [
  { label: "Free", plan: SubscriptionPlanName.Free },
  { label: "Pro", plan: SubscriptionPlanName.Pro },
  { label: "Agency", plan: SubscriptionPlanName.Agency },
] as const;

function pickFasterFixesPlan(team: number, projects: number) {
  const hosted =
    HOSTED_PLANS.find(
      ({ plan }) =>
        team <= PLAN_LIMITS[plan].seats &&
        projects <= PLAN_LIMITS[plan].projects,
    ) ?? HOSTED_PLANS[2];
  const monthly = PLAN_PRICES[hosted.plan];
  return { planLabel: hosted.label, monthly, annual: monthly * 12 };
}

// Only Starter caps seats; every higher tier has unlimited seats and is sized
// by projects. Beyond Premium, Usersnap requires an Enterprise contract.
function pickUsersnapPlan(team: number, projects: number) {
  return USERSNAP_TIERS.find(
    (tier) => team <= tier.seats && projects <= tier.projects,
  );
}

function formatSaving(usd: number) {
  return `Save ≈ ${formatAmount(Math.round(usd), "USD")} per year`;
}

export function UsersnapPricingCalculator() {
  const [team, setTeam] = useState(5);
  const [projects, setProjects] = useState(3);

  const fasterFixesHosted = pickFasterFixesPlan(team, projects);
  const usersnap = pickUsersnapPlan(team, projects);
  // Usersnap publishes no yearly price, so a year is twelve monthly payments.
  const usersnapAnnual = usersnap && {
    amount: usersnap.amount * 12,
    currency: usersnap.currency,
  };
  const usersnapAnnualUsd =
    usersnapAnnual && toUsd(usersnapAnnual.amount, usersnapAnnual.currency);
  const hostedSaving =
    usersnapAnnualUsd !== undefined &&
    usersnapAnnualUsd > fasterFixesHosted.annual
      ? formatSaving(usersnapAnnualUsd - fasterFixesHosted.annual)
      : null;
  const selfHostedSaving =
    usersnapAnnualUsd !== undefined
      ? formatSaving(usersnapAnnualUsd)
      : "Save the full Usersnap subscription";

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
          <p className="text-sm font-medium">Usersnap</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {usersnap?.name ?? "Enterprise"}
          </p>
          <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
            {usersnap
              ? formatAmount(usersnap.amount, usersnap.currency)
              : "Custom"}
            {usersnap && (
              <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {usersnapAnnual
              ? `${formatAmount(usersnapAnnual.amount, usersnapAnnual.currency)}/year (${formatUsdEquivalent(usersnapAnnual)})`
              : "Custom pricing"}
          </p>
        </div>

        <div className="bg-muted/30 p-6 md:p-8">
          <p className="text-sm font-medium">FasterFixes hosted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fasterFixesHosted.planLabel}
          </p>
          <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
            {formatAmount(fasterFixesHosted.monthly, "USD")}
            <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">
              /mo
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {formatAmount(fasterFixesHosted.annual, "USD")}/year
          </p>
          {hostedSaving && (
            <p className="mt-4 text-sm font-medium text-success tabular-nums">
              {hostedSaving}
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
            {selfHostedSaving}
          </p>
        </div>
      </div>

      <p className="border-t bg-muted/30 px-6 py-4 text-xs leading-relaxed text-muted-foreground md:px-8">
        Usersnap tiers: {starter.name} ({starter.seats} seats,{" "}
        {starter.projects} projects), then unlimited seats on {growth.name} (
        {growth.projects} projects), {professional.name} (
        {professional.projects}) and {premium.name} ({premium.projects}). Beyond{" "}
        {premium.projects} projects, Usersnap requires an Enterprise contract.
        Usersnap prices are its monthly EUR list prices, the only currency it
        publishes; yearly billing saves up to{" "}
        {COMPETITOR_PRICES.usersnap.yearlySavesUpToMonths} months. FasterFixes
        prices are in USD. {EXCHANGE_RATE_NOTE}
      </p>
    </div>
  );
}
