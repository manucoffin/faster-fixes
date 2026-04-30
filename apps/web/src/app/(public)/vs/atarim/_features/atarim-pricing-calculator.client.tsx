"use client";

import { Slider } from "@workspace/ui/components/slider";
import { useState } from "react";

const MAX_TEAM = 50;
const MAX_PROJECTS = 50;
const ATARIM_PRO_SEAT_PRICE = 25;

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

function pickAtarimPlan(team: number): PlanResult {
  const monthly = team * ATARIM_PRO_SEAT_PRICE;
  return {
    planLabel: team <= 5 ? "Pro" : "Business",
    monthly,
    annual: monthly * 12,
  };
}

function formatPrice(value: number | null): string {
  if (value === null) return "Custom";
  return `$${value.toLocaleString("en-US")}`;
}

function formatSavings(atarim: PlanResult, fasterFixes: PlanResult) {
  if (atarim.annual === null || fasterFixes.annual === null) {
    return "Compare with FasterFixes Agency";
  }
  const diff = atarim.annual - fasterFixes.annual;
  if (diff <= 0) return null;
  return `Save $${diff.toLocaleString("en-US")} per year`;
}

export function AtarimPricingCalculator() {
  const [team, setTeam] = useState(5);
  const [projects, setProjects] = useState(3);

  const fasterFixesHosted = pickFasterFixesPlan(team, projects);
  const atarim = pickAtarimPlan(team);
  const hostedSavings = formatSavings(atarim, fasterFixesHosted);
  const selfHostedSavings =
    atarim.annual !== null
      ? `Save $${atarim.annual.toLocaleString("en-US")} per year`
      : "Save the full Atarim subscription";

  return (
    <div className="bg-background mx-auto mt-12 max-w-4xl rounded-xl border p-7">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <label htmlFor="team-slider" className="text-sm font-medium">
              Team members
            </label>
            <span className="text-foreground text-lg font-semibold tabular-nums">
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
            <span className="text-foreground text-lg font-semibold tabular-nums">
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
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Atarim
          </p>
          <p className="mt-1 text-sm">{atarim.planLabel}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {formatPrice(atarim.monthly)}
            {atarim.monthly !== null && (
              <span className="text-muted-foreground ml-1 text-sm font-normal">
                /mo
              </span>
            )}
          </p>
          <p className="text-muted-foreground mt-1 text-sm tabular-nums">
            {atarim.annual !== null
              ? `${formatPrice(atarim.annual)}/year`
              : atarim.note}
          </p>
        </div>

        <div className="border-foreground bg-muted/30 rounded-lg border p-5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            FasterFixes hosted
          </p>
          <p className="mt-1 text-sm">{fasterFixesHosted.planLabel}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {formatPrice(fasterFixesHosted.monthly)}
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              /mo
            </span>
          </p>
          <p className="text-muted-foreground mt-1 text-sm tabular-nums">
            {formatPrice(fasterFixesHosted.annual)}/year
          </p>
          {hostedSavings && (
            <p className="text-success mt-3 text-sm font-semibold">
              {hostedSavings}
            </p>
          )}
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            FasterFixes self-hosted
          </p>
          <p className="mt-1 text-sm">Open source · AGPL-3.0</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">$0</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Infrastructure costs only
          </p>
          <p className="text-success mt-3 text-sm font-semibold">
            {selfHostedSavings}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Comparison based on Atarim Pro at $25/seat/month (billed yearly) vs
        FasterFixes Pro ($20/month flat for up to 5 members). Atarim&apos;s Pro
        plan caps at 5 seats; teams larger than 5 are estimated on Business
        ($35/seat/month). Check atarim.io/pricing for current rates.
      </p>
    </div>
  );
}
