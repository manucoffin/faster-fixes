import { VsSection } from "../../_features/vs-section";
import { UsersnapPricingCalculator } from "./usersnap-pricing-calculator.client";

export function UsersnapCalculatorSection() {
  return (
    <VsSection
      eyebrow="Cost calculator"
      title="How much do you save vs Usersnap?"
      intro="Drag the sliders to match your team. We pick the right plan on each side and show what each one costs per year."
    >
      <UsersnapPricingCalculator />
    </VsSection>
  );
}
