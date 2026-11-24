import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

const { hobby } = COMPETITOR_PRICES.gleap.plans;

export function GleapHero() {
  return (
    <VsHero
      breadcrumbLabel="Gleap alternatives"
      eyebrow="Gleap alternatives"
      title="The Gleap alternatives a small dev team should weigh"
      description={`Gleap now sells AI customer support, from ${formatPrice(hobby)}/mo (${formatAmount(hobby.billedYearlyAmount, hobby.currency)}/mo billed yearly) for ${hobby.seats} seat, with no free plan. If you came for bug reporting, here are nine tools, what each one charges, and the Gleap alternative that is open source and $0 on your own server.`}
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
