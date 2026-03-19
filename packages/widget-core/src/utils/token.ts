import { STORAGE_KEY_TOKEN, URL_PARAM_TOKEN } from "../constants.js";

/**
 * Reads the reviewer token from URL query params or localStorage.
 * If found in URL, stores it in localStorage and strips it from the URL.
 * Returns the token or null if not found.
 */
export function resolveReviewerToken(): string | null {
  if (typeof window === "undefined") return null;

  // Check URL first
  const url = new URL(window.location.href);
  const urlToken = url.searchParams.get(URL_PARAM_TOKEN);

  if (urlToken) {
    localStorage.setItem(STORAGE_KEY_TOKEN, urlToken);
    url.searchParams.delete(URL_PARAM_TOKEN);
    window.history.replaceState({}, "", url.toString());
    return urlToken;
  }

  // Fall back to localStorage
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}
