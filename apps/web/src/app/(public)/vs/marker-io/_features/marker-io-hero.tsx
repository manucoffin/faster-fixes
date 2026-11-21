import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import Link from "next/link";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const { starter, team } = COMPETITOR_PRICES.markerIo.plans;

export function MarkerIoHero() {
  return (
    <VsHero
      breadcrumbLabel="Marker.io alternative"
      eyebrow="Marker.io alternative"
      title={
        <>
          The <span className="whitespace-nowrap">open-source</span> Marker.io
          alternative built for developer teams
        </>
      }
      description={
        <>
          FasterFixes is an{" "}
          <Link href="/open-source">open-source feedback widget</Link> you can
          self-host for free. Each report reaches GitHub, Linear, Jira, or
          Trello, and your coding agent over MCP. Hosted, it is ${proPrice} a
          month for up to {proPlan.seats} members, where Marker.io starts at{" "}
          {formatAmount(starter.billedYearlyAmount, starter.currency)}/month for{" "}
          {starter.seats} seats and {team.name} is{" "}
          {formatAmount(team.billedYearlyAmount, team.currency)}/month, billed
          yearly.
        </>
      }
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
