import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatPrice } from "@/app/(public)/_helpers/format-competitor-price";
import { VsFitList } from "../../_features/vs-fit-list";
import { VsSection } from "../../_features/vs-section";

const { plans, otherPrices } = COMPETITOR_PRICES.gleap;

const gleapFitPoints = [
  "You want support and bug reporting in one tool: live chat, a shared inbox, a help center and an AI agent answering customers.",
  "You ship native apps: Gleap has SDKs for iOS, Android, React Native, Flutter and Ionic.",
  "You want a hosted coding agent: Kai Code turns a confirmed bug into a pull request, on Growth and up.",
  "You want longer replays: roughly the last 10 to 15 minutes before a report, on Growth and up.",
];

const lookElsewherePoints = [
  "You only need bug reports: the support desk is most of what the plan pays for.",
  `You want a free plan: Gleap has a 7-day trial, and ${plans.hobby.name} has no integrations.`,
  "Client data stays on your infrastructure: Gleap is cloud-only.",
  `Your team grows: ${plans.growth.name} includes ${plans.growth.seats} seats, then ${formatPrice(otherPrices.extraSeat)}/mo for each extra one.`,
  "You want a predictable bill: Kai and Kai Code draw on a prepaid AI balance on top of the plan.",
];

export function GleapFitSection() {
  return (
    <VsSection
      eyebrow="Fit"
      title="Is Gleap the right fit for your team?"
      intro="Gleap is worth it if you run customer support inside your product and want bug reports in the same inbox. It is a heavy bill for a dev team that only needs to know what broke on a client site."
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-xl font-medium tracking-tight">Gleap fits if</h3>
          <VsFitList points={gleapFitPoints} className="mt-6" />
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
