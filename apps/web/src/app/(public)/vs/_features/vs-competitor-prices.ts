import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";

// Monthly rate, annual rate in parentheses. One source so the /vs/ tables stop contradicting each other.
export const COMPETITOR_STARTING_PRICES = {
  fasterFixes: `$0 self-hosted / $${PLAN_PRICES[SubscriptionPlanName.Pro]}/mo Pro`,
  bugherd: "$50/mo for 5 members ($42/mo annual)",
  markerIo: "$59/mo Starter, 3 seats ($39/mo annual)",
  usersnap: "$59/mo Starter, 2 seats ($49/mo annual)",
  userback: "$49/mo Team, 5 seats ($39/mo annual)",
  atarim: "$67/mo Pro ($53.60/mo annual)",
  gleap: "$35/mo Hobby, 1 seat ($29/mo annual)",
  ruttl: "$18/user/mo ($90/mo for 5)",
  markupIo: "$79/mo Pro, 50 MarkUps",
  feedbucket: "$29/mo",
} as const;

export const SELF_HOSTED_NOTE = "AGPL-3.0";

export const ALTERNATIVES_CLOSING_NOTE =
  "FasterFixes is the only tool in this list with a permanent free tier, a self-hosting path, and an MCP server for AI coding agents.";
