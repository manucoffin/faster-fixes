import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

const { pro } = COMPETITOR_PRICES.atarim.plans;

export function AtarimHero() {
  return (
    <VsHero
      breadcrumbLabel="Atarim alternatives"
      eyebrow="Atarim alternatives"
      title="The Atarim alternatives a small dev team should weigh"
      description={`Atarim ${pro.name} is ${formatPrice(pro)}/mo, or ${formatAmount(pro.billedYearlyAmount, pro.currency)}/mo billed yearly, with AI credits on top. Here are nine tools, what each one charges, and where a developer-first Atarim alternative fits: open source, $0 on your own server.`}
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
