// The competitor prices the public pages quote, one source so the comparison
// pages, the calculators and /open-source stop contradicting each other. Each
// amount is the list price as the vendor publishes it, in the vendor's own
// currency: a converted amount is only ever shown beside it, never instead of
// it (see `format-competitor-price.ts`).

export type Currency = "USD" | "EUR";

export type Price = {
  readonly amount: number;
  readonly currency: Currency;
  // Set when the vendor publishes a range, such as a per-seat price that
  // depends on the plan.
  readonly maxAmount?: number;
};

export type CompetitorPlan = Price & {
  // Absent when the page quotes the price without naming the plan.
  readonly name?: string;
  // Per month, when the vendor publishes a lower rate for yearly billing.
  readonly billedYearlyAmount?: number;
  // `Infinity` is an unlimited plan; absent means the vendor sizes the plan
  // by something else.
  readonly seats?: number;
  readonly projects?: number;
  readonly perSeat?: true;
  // The vendor publishes this plan's price for yearly billing only, so
  // `amount` is already the per-month rate billed yearly.
  readonly billedYearlyOnly?: true;
};

export type CompetitorPricing = {
  // The day the figures were last checked against the vendor's pricing page;
  // null for figures carried over from earlier copy and not re-checked since.
  readonly verifiedOn: string | null;
  readonly plans: Readonly<Record<string, CompetitorPlan>>;
  // Published amounts that are not a plan: extra seats, usage, past prices.
  readonly otherPrices?: Readonly<Record<string, Price>>;
  // Set when the vendor states a yearly saving in months rather than a price.
  readonly yearlySavesUpToMonths?: number;
};

export const COMPETITOR_PRICES = {
  bugherd: {
    verifiedOn: null,
    yearlySavesUpToMonths: 2,
    plans: {
      standard: {
        name: "Standard",
        amount: 50,
        billedYearlyAmount: 42,
        currency: "USD",
        seats: 5,
      },
      studio: { name: "Studio", amount: 80, currency: "USD", seats: 10 },
      premium: { name: "Premium", amount: 150, currency: "USD", seats: 25 },
    },
    otherPrices: { extraSeat: { amount: 8, currency: "USD" } },
  },
  markerIo: {
    verifiedOn: null,
    plans: {
      starter: {
        name: "Starter",
        amount: 59,
        billedYearlyAmount: 39,
        currency: "USD",
        seats: 3,
      },
      team: {
        name: "Team",
        amount: 199,
        billedYearlyAmount: 149,
        currency: "USD",
        seats: 15,
      },
    },
    otherPrices: {
      extraSeat: { amount: 6, maxAmount: 9, currency: "USD" },
      extraSeatBilledYearly: { amount: 4, maxAmount: 6, currency: "USD" },
    },
  },
  usersnap: {
    verifiedOn: "2026-11-19",
    yearlySavesUpToMonths: 3,
    plans: {
      starter: {
        name: "Starter",
        amount: 49,
        currency: "EUR",
        seats: 2,
        projects: 2,
      },
      growth: {
        name: "Growth",
        amount: 129,
        currency: "EUR",
        seats: Infinity,
        projects: 10,
      },
      professional: {
        name: "Professional",
        amount: 219,
        currency: "EUR",
        seats: Infinity,
        projects: 20,
      },
      premium: {
        name: "Premium",
        amount: 459,
        currency: "EUR",
        seats: Infinity,
        projects: 50,
      },
    },
  },
  userback: {
    verifiedOn: null,
    plans: {
      team: {
        name: "Team",
        amount: 49,
        billedYearlyAmount: 39,
        currency: "USD",
        seats: 5,
      },
      business: {
        name: "Business",
        amount: 119,
        billedYearlyAmount: 89,
        currency: "USD",
        seats: 15,
        projects: 25,
      },
      businessPlus: {
        name: "Business Plus",
        amount: 199,
        currency: "USD",
        seats: 25,
        projects: 50,
      },
    },
    otherPrices: {
      extraSeat: { amount: 9, currency: "USD" },
      extraSeatBilledYearly: { amount: 7, currency: "USD" },
    },
  },
  atarim: {
    verifiedOn: null,
    plans: {
      pro: {
        name: "Pro",
        amount: 67,
        billedYearlyAmount: 53.6,
        currency: "USD",
        seats: 100,
        projects: 1000,
      },
    },
    otherPrices: {
      aiCreditsPerThousand: { amount: 6, maxAmount: 10, currency: "USD" },
    },
  },
  gleap: {
    verifiedOn: null,
    plans: {
      hobby: {
        name: "Hobby",
        amount: 35,
        billedYearlyAmount: 29,
        currency: "USD",
        seats: 1,
        projects: 1,
      },
      growth: {
        name: "Growth",
        amount: 119,
        billedYearlyAmount: 99,
        currency: "USD",
        seats: 4,
      },
      pro: {
        name: "Pro",
        amount: 299,
        billedYearlyOnly: true,
        currency: "USD",
        seats: Infinity,
      },
    },
    otherPrices: {
      extraSeat: { amount: 25, currency: "USD" },
      extraSeatPerYear: { amount: 250, currency: "USD" },
      aiConversation: { amount: 0.05, currency: "USD" },
    },
  },
  ruttl: {
    verifiedOn: null,
    plans: {
      pro: { name: "Pro", amount: 18, currency: "USD", perSeat: true },
    },
  },
  markupIo: {
    verifiedOn: null,
    plans: {
      pro: { name: "Pro", amount: 79, currency: "USD" },
      business: { name: "Business", amount: 499, currency: "USD" },
    },
    // Pro before the January 2025 price rise.
    otherPrices: { proBefore2025: { amount: 29, currency: "USD" } },
  },
  feedbucket: {
    verifiedOn: null,
    plans: {
      entry: { amount: 29, currency: "USD" },
    },
  },
} as const satisfies Readonly<Record<string, CompetitorPricing>>;

// A fixed, dated rate rather than a live one: the pages are static and every
// converted figure must stay checkable against its source.
export const EXCHANGE_RATE = {
  from: "EUR",
  to: "USD",
  rate: 1.0968,
  date: "2026-11-18",
  source: "ECB euro foreign exchange reference rate",
  sourceUrl:
    "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html",
} as const;
