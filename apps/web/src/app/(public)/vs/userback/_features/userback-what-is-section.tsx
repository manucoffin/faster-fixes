import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";
import { SectionBody } from "../../../features/_components/section-body";
import { VsSection } from "../../_features/vs-section";

const { team, business } = COMPETITOR_PRICES.userback.plans;

export function UserbackWhatIsSection() {
  return (
    <VsSection
      eyebrow="Background"
      title="What is Userback?"
      layout="split"
      className="border-t"
    >
      <SectionBody className="max-w-2xl">
        <p>
          Userback is a user feedback platform for SaaS product teams. It
          collects visual feedback, annotated video, session replay, NPS
          surveys, and feature requests from end users in one dashboard.
        </p>
        <p>
          It is closed-source and cloud-only, with no self-hosted option. Plans
          are sold by seat bundle: {team.name} is {formatPrice(team)}/month for{" "}
          {team.seats} seats, and the developer context (console logs, network
          requests, session replay) starts on {business.name} at{" "}
          {formatPrice(business)}/month.
        </p>
      </SectionBody>
    </VsSection>
  );
}
