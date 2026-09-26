import type { FeedbackItem, Labels, WidgetPosition } from "@fasterfixes/core";

import { statusColor } from "./pins.js";

// Matches the `ff-list-exit-*` animations on `.list.closing`.
const LIST_EXIT_MS = 150;
const BRANDING_URL = "https://faster-fixes.com?ref=widget";

type FeedbackListOptions = {
  labels: Labels;
  position: WidgetPosition;
  branding: boolean;
};

type FeedbackListActions = {
  onSelect: (item: FeedbackItem) => void;
};

export type FeedbackList = {
  element: HTMLElement;
  /** Slides the panel in or out; the exit animation runs before it hides. */
  setOpen: (open: boolean) => void;
  /** Hides at once, without the exit animation. */
  close: () => void;
  readonly isOpen: boolean;
  render: (items: readonly FeedbackItem[]) => void;
};

/** The items a list row is rendered for: resolved and closed only on request. */
export function listedFeedback(
  items: readonly FeedbackItem[],
  showResolved: boolean,
) {
  if (showResolved) return items;
  return items.filter(
    (item) => item.status !== "resolved" && item.status !== "closed",
  );
}

/** The page a row names: the URL's path and query, or the raw value if unparsable. */
export function pagePath(pageUrl: string) {
  try {
    const { pathname, search } = new URL(pageUrl);
    return `${pathname}${search}`;
  } catch {
    return pageUrl;
  }
}

/**
 * Every Feedback item of the Project, beside the toolbar. Resolved and closed
 * items are hidden until the Reviewer asks for them.
 */
export function createFeedbackList(
  document: Document,
  { labels, position, branding }: FeedbackListOptions,
  { onSelect }: FeedbackListActions,
): FeedbackList {
  const panel = document.createElement("div");
  panel.className = "list";
  panel.setAttribute("part", "list");
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", labels.feedbackListTitle);
  // Slides in from the screen edge the Widget is anchored to.
  panel.dataset.from = position.includes("right") ? "right" : "left";
  panel.hidden = true;

  const header = document.createElement("div");
  header.className = "list-header";
  const title = document.createElement("span");
  title.className = "list-title";
  title.textContent = labels.feedbackListTitle;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "list-toggle";
  header.append(title, toggle);

  const rows = document.createElement("ul");
  rows.className = "list-rows";

  const empty = document.createElement("p");
  empty.className = "list-empty";
  empty.textContent = labels.emptyList;

  panel.append(header, rows, empty);

  if (branding) {
    const footer = document.createElement("div");
    footer.className = "list-footer";
    const link = document.createElement("a");
    link.href = BRANDING_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = labels.brandingLink;
    footer.appendChild(link);
    panel.appendChild(footer);
  }

  let items: readonly FeedbackItem[] = [];
  let showResolved = false;
  let open = false;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function createRow(item: FeedbackItem) {
    const row = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    button.setAttribute("part", "list-item");
    button.dataset.ffFeedbackId = item.id;

    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.style.backgroundColor = statusColor(item.status);
    dot.dataset.status = item.status;

    const text = document.createElement("span");
    text.className = "list-item-text";
    const comment = document.createElement("span");
    comment.className = "list-item-comment";
    comment.textContent = item.comment;
    const page = document.createElement("span");
    page.className = "list-item-page";
    page.textContent = pagePath(item.pageUrl);
    text.append(comment, page);

    button.append(dot, text);
    button.addEventListener("click", () => onSelect(item));
    row.appendChild(button);
    return row;
  }

  function update() {
    toggle.textContent = showResolved
      ? labels.hideResolved
      : labels.showResolved;
    toggle.setAttribute("aria-pressed", String(showResolved));
    const visible = listedFeedback(items, showResolved);
    rows.replaceChildren(...visible.map(createRow));
    rows.hidden = visible.length === 0;
    empty.hidden = visible.length > 0;
  }

  function clearCloseTimer() {
    if (closeTimer !== null) clearTimeout(closeTimer);
    closeTimer = null;
  }

  function close() {
    clearCloseTimer();
    open = false;
    panel.hidden = true;
    panel.classList.remove("closing");
  }

  toggle.addEventListener("click", () => {
    showResolved = !showResolved;
    update();
  });

  update();

  return {
    element: panel,
    setOpen(next) {
      if (next === open) return;
      clearCloseTimer();
      open = next;
      panel.classList.toggle("closing", !next);
      if (next) panel.hidden = false;
      else closeTimer = setTimeout(close, LIST_EXIT_MS);
    },
    close,
    get isOpen() {
      return open;
    },
    render(next) {
      items = next;
      update();
    },
  };
}
