import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatPrice } from "@/app/(public)/_helpers/format-competitor-price";

const { plans, otherPrices } = COMPETITOR_PRICES.markupIo;
const proBefore = otherPrices.proBefore2025.amount;

export const markupIoPro = formatPrice(plans.pro);
export const markupIoProBefore2025 = formatPrice(otherPrices.proBefore2025);
// The January 2025 Pro price rise, in percent.
export const markupIoPriceRise = Math.round(
  ((plans.pro.amount - proBefore) / proBefore) * 100,
);
