import { describe, expect, it } from "vitest";

import { COMPETITOR_PRICES, EXCHANGE_RATE } from "./competitor-prices";
import {
  EXCHANGE_RATE_NOTE,
  formatAmount,
  formatPrice,
  formatPublishedPrice,
  formatUsdEquivalent,
  toUsd,
} from "./format-competitor-price";

const growth = COMPETITOR_PRICES.usersnap.plans.growth;

describe("formatAmount", () => {
  it("drops cents on whole amounts and keeps two otherwise", () => {
    expect(formatAmount(129, "EUR")).toBe("€129");
    expect(formatAmount(53.6, "USD")).toBe("$53.60");
    expect(formatAmount(1080, "USD")).toBe("$1,080");
  });
});

describe("formatPrice", () => {
  it("writes a range with both bounds", () => {
    expect(formatPrice({ amount: 4, maxAmount: 6, currency: "USD" })).toBe(
      "$4–$6",
    );
  });
});

describe("toUsd", () => {
  it("converts EUR at the fixed rate and leaves USD alone", () => {
    expect(toUsd(100, "EUR")).toBeCloseTo(100 * EXCHANGE_RATE.rate);
    expect(toUsd(50, "USD")).toBe(50);
  });
});

describe("formatUsdEquivalent", () => {
  it("rounds a EUR price to the dollar and marks it approximate", () => {
    expect(formatUsdEquivalent({ amount: 129, currency: "EUR" })).toBe(
      `≈ $${Math.round(129 * EXCHANGE_RATE.rate)}`,
    );
  });

  it("returns null for a USD price", () => {
    expect(formatUsdEquivalent({ amount: 50, currency: "USD" })).toBeNull();
  });
});

describe("formatPublishedPrice", () => {
  it("leads with the published price and follows with the equivalent", () => {
    expect(formatPublishedPrice(growth, "/mo")).toBe(
      `€129/mo (≈ $${Math.round(129 * EXCHANGE_RATE.rate)})`,
    );
  });

  it("shows a USD price alone", () => {
    expect(
      formatPublishedPrice(COMPETITOR_PRICES.bugherd.plans.standard, "/mo"),
    ).toBe("$50/mo");
  });
});

describe("EXCHANGE_RATE_NOTE", () => {
  it("cites the rate and its date", () => {
    expect(EXCHANGE_RATE_NOTE).toContain(String(EXCHANGE_RATE.rate));
    expect(EXCHANGE_RATE_NOTE).toContain("November 18, 2026");
  });
});
