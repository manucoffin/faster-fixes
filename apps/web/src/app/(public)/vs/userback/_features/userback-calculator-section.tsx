import { VsSection } from "../../_features/vs-section";
import { UserbackPricingCalculator } from "./userback-pricing-calculator.client";

export function UserbackCalculatorSection() {
  return (
    <VsSection
      eyebrow="Cost calculator"
      title="How much do you save vs Userback?"
      intro="Drag the sliders to match your team. We pick the right plan on each side and show your annual savings in real time."
    >
      <UserbackPricingCalculator />
    </VsSection>
  );
}
