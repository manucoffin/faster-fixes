import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";

import { COMPETITOR_PRICES as PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPublishedPrice,
} from "@/app/(public)/_helpers/format-competitor-price";

const { bugherd, markerIo, usersnap, userback, atarim, gleap, ruttl } = PRICES;

const yearly = (amount: number) => formatAmount(amount, "USD");

// Monthly rate, annual rate in parentheses. One source so the /vs/ tables stop contradicting each other.
export const COMPETITOR_STARTING_PRICES = {
  fasterFixes: `$0 self-hosted / $${PLAN_PRICES[SubscriptionPlanName.Pro]}/mo Pro`,
  bugherd: `${formatPublishedPrice(bugherd.plans.standard, "/mo")} for ${bugherd.plans.standard.seats} members (${yearly(bugherd.plans.standard.billedYearlyAmount)}/mo annual)`,
  markerIo: `${formatPublishedPrice(markerIo.plans.starter, "/mo")} Starter, ${markerIo.plans.starter.seats} seats (${yearly(markerIo.plans.starter.billedYearlyAmount)}/mo annual)`,
  usersnap: `${formatPublishedPrice(usersnap.plans.starter, "/mo")} Starter, ${usersnap.plans.starter.seats} seats`,
  userback: `${formatPublishedPrice(userback.plans.team, "/mo")} Team, ${userback.plans.team.seats} seats (${yearly(userback.plans.team.billedYearlyAmount)}/mo annual)`,
  atarim: `${formatPublishedPrice(atarim.plans.pro, "/mo")} Pro (${yearly(atarim.plans.pro.billedYearlyAmount)}/mo annual)`,
  gleap: `${formatPublishedPrice(gleap.plans.hobby, "/mo")} Hobby, ${gleap.plans.hobby.seats} seat (${yearly(gleap.plans.hobby.billedYearlyAmount)}/mo annual)`,
  ruttl: `${formatPublishedPrice(ruttl.plans.pro, "/user/mo")} (${formatAmount(ruttl.plans.pro.amount * 5, "USD")}/mo for 5)`,
  markupIo: `${formatPublishedPrice(PRICES.markupIo.plans.pro, "/mo")} Pro, 50 MarkUps`,
  feedbucket: `${formatPublishedPrice(PRICES.feedbucket.plans.entry, "/mo")}`,
} as const;

export const SELF_HOSTED_NOTE = "AGPL-3.0";

export const ALTERNATIVES_CLOSING_NOTE =
  "FasterFixes is the only tool in this list with a permanent free tier, a self-hosting path, and an MCP server for AI coding agents.";
