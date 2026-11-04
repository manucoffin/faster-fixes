export const VARIANT_KEYS = ["A", "B", "C"] as const;
export type VariantKey = (typeof VARIANT_KEYS)[number];

export const REVIEW_PAGE_STATES = ["open", "closed", "revoked"] as const;
export type ReviewPageState = (typeof REVIEW_PAGE_STATES)[number];

type SearchParam = string | string[] | undefined;

export function parseVariantKey(value: SearchParam): VariantKey {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VARIANT_KEYS.find((key) => key === candidate) ?? "A";
}

export function parseReviewPageState(value: SearchParam): ReviewPageState {
  const candidate = Array.isArray(value) ? value[0] : value;
  return REVIEW_PAGE_STATES.find((state) => state === candidate) ?? "open";
}
