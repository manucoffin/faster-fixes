import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { VsActions } from "../../_features/vs-actions";
import { VsCtaSection } from "../../_features/vs-cta-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

export function AtarimCtaSection() {
  return (
    <VsCtaSection
      title="Ready to switch from Atarim?"
      body={`Self-host for $0, or run hosted Pro at $${proPrice}/mo for up to ${proPlan.seats} members and ${proPlan.projects} projects.`}
      actions={
        <VsActions
          signupLabel="Try FasterFixes free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
