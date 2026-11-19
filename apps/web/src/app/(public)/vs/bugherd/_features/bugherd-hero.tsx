import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import Link from "next/link";
import { BugherdRoutingAnimation } from "../_components/illustrations/bugherd-routing-animation";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

export function BugherdHero() {
  return (
    <VsHero
      breadcrumbLabel="BugHerd alternative"
      eyebrow="BugHerd alternative"
      title={
        <>
          The <span className="whitespace-nowrap">open-source</span> BugHerd
          alternative built for developer teams
        </>
      }
      description={
        <>
          FasterFixes is an{" "}
          <Link href="/open-source">open-source feedback widget</Link> and the
          self-hostable alternative to BugHerd: flat-rate at ${proPrice} a month
          for up to {proPlan.seats} members, or free if you self-host. Where
          BugHerd routes feedback to a Kanban board, FasterFixes routes it to
          GitHub, Linear, or Jira with a full repro bundle, and exposes every
          report to Claude Code and Cursor over MCP.
        </>
      }
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
      illustration={<BugherdRoutingAnimation />}
    />
  );
}
