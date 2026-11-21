import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatPrice } from "@/app/(public)/_helpers/format-competitor-price";
import { VsFitList } from "../../_features/vs-fit-list";
import { VsSection } from "../../_features/vs-section";

const { starter } = COMPETITOR_PRICES.usersnap.plans;

const usersnapFitPoints = [
  "You run in-app surveys, NPS or logic-based forms.",
  "You want a public roadmap with idea voting.",
  "You want AI topic and sentiment analysis over your feedback.",
  "Non-technical reporters need a browser extension, not a widget.",
  "You need SSO, SAML or 50+ integrations.",
];

const lookElsewherePoints = [
  `Your project count grows: ${starter.name} at ${formatPrice(starter)}/mo covers ${starter.seats} seats and ${starter.projects} projects, and every tier above is sized by projects.`,
  "You need to self-host: Usersnap is cloud-only.",
  "You want a permanent free plan: Usersnap offers a trial.",
  "Your developers need the DOM selector and component behind each report.",
  "You want your coding agent to fix feedback, not only analyze it.",
];

export function UsersnapFitSection() {
  return (
    <VsSection
      eyebrow="Fit"
      title="Is Usersnap the right fit for your team?"
      intro="For an enterprise product team running surveys, roadmaps and AI feedback analysis across many products, yes. A small dev team fixing client sites usually outgrows its project tiers first."
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Usersnap fits if
          </h3>
          <VsFitList points={usersnapFitPoints} className="mt-6" />
        </div>
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Look elsewhere if
          </h3>
          <VsFitList points={lookElsewherePoints} className="mt-6" />
        </div>
      </div>
    </VsSection>
  );
}
