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
  // Only Starter caps seats; every higher tier has unlimited seats and is sized by projects.
  if (team <= 2 && projects <= 2) {
    return { planLabel: "Starter", monthly: 59, annual: 708 };
  }
  if (projects <= 10) {
    return { planLabel: "Growth", monthly: 159, annual: 1908 };
  }
  if (projects <= 20) {
    return { planLabel: "Professional", monthly: 259, annual: 3108 };
  }
  if (projects <= 50) {
    return { planLabel: "Premium", monthly: 549, annual: 6588 };
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
            {usersnap.planLabel}
          </p>
          <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
            {formatPrice(usersnap.monthly)}
            {usersnap.monthly !== null && (
              <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground tabular-nums">
            {usersnap.annual !== null
              ? `${formatPrice(usersnap.annual)}/year`
              : usersnap.note}
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
        Usersnap tiers: Starter (2 seats, 2 projects), then unlimited seats on
        Growth (10 projects), Professional (20) and Premium (50). Beyond 50
        projects, Usersnap requires an Enterprise contract. Prices are
        Usersnap&apos;s USD monthly rates; annual billing lowers them to $49,
        $129, $209 and $449 per month.
      </p>
    </div>
  );
}
