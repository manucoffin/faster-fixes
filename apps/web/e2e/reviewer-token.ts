import type { Page } from "@playwright/test";

// Frozen literals rather than core's constants: a rename in core would silently
// log out every Reviewer, and this suite is where that must fail.
export const STORAGE_KEY_TOKEN = "ff_reviewer_token";
export const URL_PARAM_TOKEN = "ff_token";
export const REVIEWER_TOKEN = "rt_e2e_reviewer";

/** Stores a Reviewer token before any page script runs. */
export function seedReviewerToken(page: Page) {
  return page.addInitScript(
    ([key, token]) => window.localStorage.setItem(key, token),
    [STORAGE_KEY_TOKEN, REVIEWER_TOKEN] as const,
  );
}
