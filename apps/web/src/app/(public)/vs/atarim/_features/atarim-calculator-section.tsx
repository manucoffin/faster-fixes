import { AtarimPricingCalculator } from "./atarim-pricing-calculator.client";

export function AtarimCalculatorSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Cost calculator
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            How much do you save vs Atarim?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Drag the sliders to match your team. We pick the right plan on
            each side and show your annual savings in real time.
          </p>
        </div>

        <AtarimPricingCalculator />
      </div>
    </section>
  );
}
