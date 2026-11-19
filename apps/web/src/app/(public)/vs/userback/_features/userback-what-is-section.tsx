import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";
import { SectionBody } from "../../../features/_components/section-body";
import { VsSection } from "../../_features/vs-section";

const { team, business, businessPlus } = COMPETITOR_PRICES.userback.plans;

export function UserbackWhatIsSection() {
  return (
    <VsSection
      eyebrow="Background"
      title="What is Userback?"
      className="border-t"
    >
      <SectionBody className="max-w-3xl">
        <p>
          Userback is a cloud-hosted user feedback platform founded in 2016 and
          used by 20,000+ product teams. It captures visual feedback, annotated
          video, and session replay from end users, and centralizes it in a
          dashboard for product managers, designers, and developers.
        </p>
        <p>
          The platform layers in NPS, CSAT, and CES microsurveys, AI-driven
          sentiment analysis on the Business and Business Plus plans, and a
          public Feature Portal for collecting and prioritizing feature
          requests, an add-on on Team and included from Business. Integrations
          cover Jira, ClickUp (with two-way sync), and Zapier, with a JavaScript
          SDK from Business and a mobile SDK on Business Plus.
        </p>
        <p>
          Userback is closed-source and cloud-only. There is no self-hosted
          option, and plans include a fixed number of seats ({team.name}{" "}
          {formatPrice(team)}/month for {team.seats}, {business.name}{" "}
          {formatPrice(business)}/month for {business.seats},{" "}
          {businessPlus.name} {formatPrice(businessPlus)}/month for{" "}
          {businessPlus.seats}, monthly billing). It is built primarily for SaaS
          product teams collecting end-user feedback at scale, not for developer
          teams running structured bug-fix workflows.
        </p>
      </SectionBody>
    </VsSection>
  );
}
