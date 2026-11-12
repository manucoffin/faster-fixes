"use client";

import { Slider } from "@workspace/ui/components/slider";
import { useState } from "react";

const MAX_TEAM = 50;
const MAX_PROJECTS = 50;
// Userback monthly billing: a plan price covers a bundle of seats and sites,
// extra seats cost $9/month each on Business and Business Plus.
const USERBACK_EXTRA_SEAT_PRICE = 9;
const USERBACK_BUSINESS = {
  label: "Business",
  price: 119,
  seats: 15,
  sites: 25,
};
const USERBACK_BUSINESS_PLUS = {
  label: "Business Plus",
  price: 199,
  seats: 25,
  sites: 50,
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
  if (team <= 5 && projects <= 5) {
    return { planLabel: "Pro", monthly: 20, annual: 240 };
  }
  return { planLabel: "Agency", monthly: 99, annual: 1188 };
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
    <div className="mx-auto mt-12 max-w-4xl rounded-xl border bg-background p-7">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <label htmlFor="team-slider" className="text-sm font-medium">
              Team members
            </label>
            <span className="text-lg font-semibold text-foreground tabular-nums">
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
          <div className="mb-3 flex items-baseline justify-between">
            <label htmlFor="projects-slider" className="text-sm font-medium">
              Active projects
            </label>
            <span className="text-lg font-semibold text-foreground tabular-nums">
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

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-5">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Userback
          </p>
          <p className="mt-1 text-sm">{userback.planLabel}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {formatPrice(userback.monthly)}
            {userback.monthly !== null && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {userback.annual !== null
              ? `${formatPrice(userback.annual)}/year`
              : userback.note}
          </p>
        </div>

        <div className="rounded-lg border border-foreground bg-muted/30 p-5">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            FasterFixes hosted
          </p>
          <p className="mt-1 text-sm">{fasterFixesHosted.planLabel}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {formatPrice(fasterFixesHosted.monthly)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              /mo
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {formatPrice(fasterFixesHosted.annual)}/year
          </p>
          {hostedSavings && (
            <p className="mt-3 text-sm font-semibold text-success">
              {hostedSavings}
            </p>
          )}
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            FasterFixes self-hosted
          </p>
          <p className="mt-1 text-sm">Open source · AGPL-3.0</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">$0</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Infrastructure costs only
          </p>
          <p className="mt-3 text-sm font-semibold text-success">
            {selfHostedSavings}
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Calculation uses Userback Business, the closest equivalent to
        FasterFixes for structured bug reporting: $119/month for 15 seats and 25
        sites, plus $9/month per extra seat. Above 25 projects it uses Business
        Plus: $199/month for 25 seats and 50 sites. The cheaper Team plan
        ($49/month for 5 seats) omits console logs, network capture, session
        replay, and surveys. Annual savings are calculated against Userback
        monthly billing; annual billing brings Business to $89/month and extra
        seats to $7/month. Check userback.io/pricing for current rates.
      </p>
    </div>
  );
}
