"use client";

import { Slider } from "@workspace/ui/components/slider";
import { useState } from "react";

const MAX_TEAM = 50;
const MAX_PROJECTS = 50;
// Atarim Pro is flat up to 100 seats and 1,000 projects, beyond both sliders.
const ATARIM_PRO_MONTHLY_PRICE = 67;
const ATARIM_PRO_ANNUAL_PRICE = 643.2;

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

const atarim: PlanResult = {
  planLabel: "Pro · up to 100 seats",
  monthly: ATARIM_PRO_MONTHLY_PRICE,
  annual: ATARIM_PRO_ANNUAL_PRICE,
};

function formatAmount(value: number): string {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

function formatPrice(value: number | null): string {
  if (value === null) return "Custom";
  return formatAmount(value);
}

function formatSavings(atarim: PlanResult, fasterFixes: PlanResult) {
  if (atarim.annual === null || fasterFixes.annual === null) {
    return null;
  }
  const diff = atarim.annual - fasterFixes.annual;
  if (diff > 0) {
    return { saves: true, text: `Save ${formatAmount(diff)} per year` };
  }
  if (diff < 0) {
    return {
      saves: false,
      text: `${formatAmount(-diff)} per year more than Atarim Pro`,
    };
  }
  return null;
}

export function AtarimPricingCalculator() {
  const [team, setTeam] = useState(5);
  const [projects, setProjects] = useState(3);

  const fasterFixesHosted = pickFasterFixesPlan(team, projects);
  const hostedSavings = formatSavings(atarim, fasterFixesHosted);
  const selfHostedSavings =
    atarim.annual !== null
      ? `Save ${formatAmount(atarim.annual)} per year`
      : "Save the full Atarim subscription";

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
            Atarim
          </p>
          <p className="mt-1 text-sm">{atarim.planLabel}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {formatPrice(atarim.monthly)}
            {atarim.monthly !== null && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {atarim.annual !== null
              ? `${formatPrice(atarim.annual)}/year billed yearly`
              : atarim.note}
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
            <p
              className={`mt-3 text-sm font-semibold ${
                hostedSavings.saves ? "text-success" : "text-muted-foreground"
              }`}
            >
              {hostedSavings.text}
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
        Comparison based on Atarim Pro at $67/month, or $643.20/year billed
        yearly, flat for up to 100 seats and 1,000 projects, vs FasterFixes Pro
        ($20/month for up to 5 members and 5 projects) and Agency ($99/month,
        unlimited). Atarim AI credits beyond the 5,000 included each month are
        not counted. Check atarim.io/pricing for current rates.
      </p>
    </div>
  );
}
