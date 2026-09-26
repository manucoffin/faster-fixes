"use client";

import { Slider } from "@workspace/ui/components/slider";
import { useState } from "react";

const MAX_TEAM = 50;
const MAX_PROJECTS = 50;

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

function pickUsersnapPlan(team: number, projects: number): PlanResult {
  const seats = Math.max(team, projects);
  if (seats <= 5) {
    return { planLabel: "Starter", monthly: 49, annual: 468 };
  }
  if (seats <= 10) {
    return { planLabel: "Growth", monthly: 109, annual: 1068 };
  }
  if (seats <= 20) {
    return { planLabel: "Professional", monthly: 199, annual: 1908 };
  }
  if (seats <= 50) {
    return { planLabel: "Premium", monthly: 319, annual: 3828 };
  }
  return {
    planLabel: "Enterprise",
    monthly: null,
    annual: null,
    note: "Custom pricing",
  };
}

function formatPrice(value: number | null): string {
  if (value === null) return "Custom";
  return `$${value.toLocaleString("en-US")}`;
}

function formatSavings(usersnap: PlanResult, fasterFixes: PlanResult) {
  if (usersnap.annual === null || fasterFixes.annual === null) {
    return "Compare with FasterFixes Agency";
  }
  const diff = usersnap.annual - fasterFixes.annual;
  if (diff <= 0) return null;
  return `Save $${diff.toLocaleString("en-US")} per year`;
}

export function UsersnapPricingCalculator() {
  const [team, setTeam] = useState(5);
  const [projects, setProjects] = useState(3);

  const fasterFixesHosted = pickFasterFixesPlan(team, projects);
  const usersnap = pickUsersnapPlan(team, projects);
  const hostedSavings = formatSavings(usersnap, fasterFixesHosted);
  const selfHostedSavings =
    usersnap.annual !== null
      ? `Save $${usersnap.annual.toLocaleString("en-US")} per year`
      : "Save the full Usersnap subscription";

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
            Usersnap
          </p>
          <p className="mt-1 text-sm">{usersnap.planLabel}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {formatPrice(usersnap.monthly)}
            {usersnap.monthly !== null && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {usersnap.annual !== null
              ? `${formatPrice(usersnap.annual)}/year`
              : usersnap.note}
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
        Usersnap tiers: Starter (5 seats / 5 projects), Growth (10 / 10),
        Professional (20 / 20), Premium (50 / 50). Beyond 50, Usersnap requires
        an Enterprise contract. Annual savings are calculated against Usersnap
        monthly billing; their annual plans discount the first three tiers by
        ~20%.
      </p>
    </div>
  );
}
