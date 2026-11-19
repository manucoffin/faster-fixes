import { type Currency, EXCHANGE_RATE, type Price } from "./competitor-prices";

const SYMBOLS: Record<Currency, string> = { USD: "$", EUR: "€" };

/** `129` in EUR is "€129", `53.6` in USD is "$53.60", `1080` is "$1,080". */
export function formatAmount(amount: number, currency: Currency): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `${SYMBOLS[currency]}${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/** The published figure in its own currency: "€49" or the range "$4–$6". */
export function formatPrice(price: Price): string {
  const amount = formatAmount(price.amount, price.currency);
  if (price.maxAmount === undefined) return amount;
  return `${amount}–${formatAmount(price.maxAmount, price.currency)}`;
}

/** The exact USD value of an amount, at the fixed `EXCHANGE_RATE`. */
export function toUsd(amount: number, currency: Currency): number {
  return currency === "USD" ? amount : amount * EXCHANGE_RATE.rate;
}

/**
 * The USD equivalent of a non-USD price, rounded to the dollar and marked as
 * approximate: "≈ $141". Null for a USD price, which needs no equivalent.
 */
export function formatUsdEquivalent(price: Price): string | null {
  if (price.currency === "USD") return null;
  const usd = (amount: number) =>
    formatAmount(Math.round(toUsd(amount, price.currency)), "USD");
  const range =
    price.maxAmount === undefined
      ? usd(price.amount)
      : `${usd(price.amount)}–${usd(price.maxAmount)}`;
  return `≈ ${range}`;
}

/**
 * The published price first, in its own currency, then its USD equivalent:
 * "€129/mo (≈ $141)". A USD price reads "$50/mo". The converted amount is never
 * presented as the vendor's price.
 */
export function formatPublishedPrice(price: Price, suffix = ""): string {
  const published = `${formatPrice(price)}${suffix}`;
  const equivalent = formatUsdEquivalent(price);
  return equivalent ? `${published} (${equivalent})` : published;
}

const RATE_DATE = new Date(
  `${EXCHANGE_RATE.date}T00:00:00Z`,
).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** The footnote every page showing a converted amount carries. */
export const EXCHANGE_RATE_NOTE = `USD equivalents are approximate, converted at the ${EXCHANGE_RATE.source} of ${RATE_DATE}: €1 = $${EXCHANGE_RATE.rate}.`;
