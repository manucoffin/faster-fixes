import { APP_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import {
  PLAN_DESCRIPTIONS,
  PLAN_FEATURES,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_features/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/_features/seo/software-application-schema";
import { WebPageSchema } from "@/app/_features/seo/web-page-schema";
import { PricingCard } from "./_features/pricing-card";
import {
  PricingFaqSection,
  pricingFaqs,
} from "./_features/pricing-faq-section";

const pageUrl = `${APP_URL}/pricing`;
// GSC shows the impressions here come from competitor price research
// ("atarim pricing", "ruttl pricing"), not from brand queries — so the snippet
// leads with the numbers and the flat-rate model rather than "simple pricing".
const title = "Pricing — $0 self-hosted, $20/mo flat rate";
const description =
  "Self-host free under AGPL-3.0, or $20/month flat for up to 5 members and $99 for unlimited. Flat rate, not per seat — see what you would actually pay.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "FasterFixes pricing",
    "feedback widget pricing",
    "flat rate feedback tool",
    "self-hosted feedback widget pricing",
    "bug tracking without per-seat pricing",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    title,
    description,
  },
};

export default function Page() {
  return (
    <div>
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="text-3xl font-bold md:text-5xl">Pricing</h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Start free, upgrade when you need more.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {Object.values(SubscriptionPlanName).map((planName) => {
              const isHighlighted = planName === SubscriptionPlanName.Pro;

              return (
                <PricingCard
                  key={planName}
                  title={planName}
                  description={PLAN_DESCRIPTIONS[planName]}
                  price={PLAN_PRICES[planName]}
                  features={PLAN_FEATURES[planName]}
                  variant={isHighlighted ? "highlighted" : "default"}
                  badge={isHighlighted ? "Most popular" : undefined}
                >
                  <Button
                    asChild
                    className="w-full"
                    variant={isHighlighted ? "default" : "secondary"}
                  >
                    <Link href={signupUrl}>Get started</Link>
                  </Button>
                </PricingCard>
              );
            })}
          </div>
        </div>
      </section>

      <PricingFaqSection />

      <FaqSchema faqs={pricingFaqs} />

      <SoftwareApplicationSchema />

      <WebPageSchema
        title={title}
        description={description}
        url={pageUrl}
        aboutId={`${APP_URL}#software`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: APP_URL },
          { name: "Pricing", url: pageUrl },
        ]}
      />
    </div>
  );
}
