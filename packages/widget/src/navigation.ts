// Same key as the React Embed, so a pending item survives a switch between Embeds.
export const PENDING_FEEDBACK_KEY = "ff_pending_feedback";

// Matches the React Embed: history API routers do not all emit popstate on push.
const LOCATION_POLL_MS = 500;

type PendingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
// A getter, because reading `window.sessionStorage` itself throws when storage is blocked.
type StorageGetter = () => PendingStorage;

/** Whether the Widget may navigate to a Feedback item's page URL. */
export function isNavigableUrl(pageUrl: string) {
  return pageUrl.startsWith("https://") || pageUrl.startsWith("http://");
}

/** Records the item to activate once its page has loaded. */
export function storePendingFeedback(storage: StorageGetter, id: string) {
  try {
    storage().setItem(PENDING_FEEDBACK_KEY, id);
  } catch {
    // Storage can be disabled; the navigation still happens
  }
}

/** Reads and clears the pending item id, so it is restored once only. */
export function takePendingFeedback(storage: StorageGetter) {
  try {
    const store = storage();
    const id = store.getItem(PENDING_FEEDBACK_KEY);
    if (id !== null) store.removeItem(PENDING_FEEDBACK_KEY);
    return id;
  } catch {
    return null;
  }
}

/**
 * Calls `onChange` with the new URL whenever the location changes without a
 * reload. Returns a function that stops watching.
 */
export function watchLocation(onChange: (href: string) => void) {
  let current = window.location.href;
  function check() {
    const href = window.location.href;
    if (href === current) return;
    current = href;
    onChange(href);
  }
  window.addEventListener("popstate", check);
  const interval = setInterval(check, LOCATION_POLL_MS);
  return () => {
    window.removeEventListener("popstate", check);
    clearInterval(interval);
  };
}
