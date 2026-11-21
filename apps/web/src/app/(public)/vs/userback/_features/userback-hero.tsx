import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const { business } = COMPETITOR_PRICES.userback.plans;

export function UserbackHero() {
  return (
    <VsHero
      breadcrumbLabel="Userback alternative"
      eyebrow="Userback alternative"
      title="The open-source Userback alternative"
      description={`FasterFixes is an open-source, self-hostable alternative to Userback, built for developer teams. Each bug report arrives with a screenshot, DOM selector, React component tree, console logs, and network requests, in your issue tracker and in Claude Code, Cursor, or Codex. Free self-hosted, $${proPrice}/month hosted for ${proPlan.seats} members, where Userback ${business.name} starts at ${formatPrice(business)}/month.`}
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
