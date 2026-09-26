import type { FeedbackItem, Labels } from "@fasterfixes/core";

import { isWidgetEvent } from "./annotation.js";
import { createIcon } from "./icons.js";
import { statusColor } from "./pins.js";
import {
  anchorBelow,
  createActionButton,
  POPOVER_FADEOUT_MS,
} from "./popover-shell.js";

type PinPopoverActions = {
  /** Sends the new comment; a rejection is shown inline. */
  onSave: (item: FeedbackItem, comment: string) => Promise<void>;
  /** Sends the delete; a rejection is shown inline. */
  onDelete: (item: FeedbackItem) => Promise<void>;
  /** The popover closed on its own: close control, outside click, Escape, save or delete. */
  onClose: () => void;
};

export type PinPopover = {
  open: (item: FeedbackItem, pin: HTMLElement) => void;
  /** Closes with the fade-out and notifies `onClose`. */
  dismiss: () => void;
  /** Follows a reloaded list: refreshes the item, or closes when it has no pin anymore. */
  sync: (pinned: readonly FeedbackItem[]) => void;
  /** Closes at once, without notifying. */
  close: () => void;
  readonly itemId: string | null;
};

type PopoverView = "view" | "edit" | "confirm-delete";

/**
 * The popover a pin opens: the Feedback's comment, Reviewer and Status, with
 * edit and a confirmed delete. It shares the comment popover's shell and
 * anchoring, and closes on an outside click or Escape.
 */
export function createPinPopover(
  document: Document,
  container: ShadowRoot,
  labels: Labels,
  { onSave, onDelete, onClose }: PinPopoverActions,
): PinPopover {
  const popover = document.createElement("div");
  popover.className = "popover";
  popover.setAttribute("part", "popover");
  popover.dataset.ffPinPopover = "";

  const header = document.createElement("div");
  header.className = "popover-header";
  const status = document.createElement("span");
  status.className = "status-dot";
  const reviewer = document.createElement("span");
  reviewer.className = "reviewer";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "icon-action";
  closeButton.setAttribute("aria-label", labels.closeButton);
  closeButton.appendChild(createIcon(document, "close", 14));
  const who = document.createElement("div");
  who.className = "popover-meta";
  who.append(status, reviewer);
  header.append(who, closeButton);

  const errorMessage = document.createElement("p");
  errorMessage.className = "error-message";
  errorMessage.setAttribute("role", "alert");

  const viewPane = document.createElement("div");
  const comment = document.createElement("p");
  comment.className = "comment";
  const viewActions = document.createElement("div");
  viewActions.className = "actions actions-start";
  const editButton = createActionButton(
    document,
    labels.editButton,
    "secondary",
  );
  const deleteButton = createActionButton(
    document,
    labels.deleteButton,
    "secondary",
  );
  deleteButton.classList.add("action-destructive");
  viewActions.append(editButton, deleteButton);
  viewPane.append(comment, viewActions);

  const editPane = document.createElement("div");
  const textarea = document.createElement("textarea");
  textarea.className = "textarea";
  textarea.setAttribute("part", "textarea");
  textarea.setAttribute("aria-label", labels.textareaPlaceholder);
  const editActions = document.createElement("div");
  editActions.className = "actions";
  const editCancelButton = createActionButton(
    document,
    labels.cancelButton,
    "secondary",
  );
  const saveButton = createActionButton(document, labels.saveButton, "primary");
  editActions.append(editCancelButton, saveButton);
  editPane.append(textarea, editActions);

  const confirmPane = document.createElement("div");
  const confirmText = document.createElement("p");
  confirmText.className = "comment";
  confirmText.textContent = labels.deleteConfirm;
  const confirmActions = document.createElement("div");
  confirmActions.className = "actions actions-start";
  const confirmCancelButton = createActionButton(
    document,
    labels.cancelButton,
    "secondary",
  );
  const confirmDeleteButton = createActionButton(
    document,
    labels.deleteButton,
    "danger",
  );
  confirmActions.append(confirmCancelButton, confirmDeleteButton);
  confirmPane.append(confirmText, confirmActions);

  popover.append(header, errorMessage, viewPane, editPane, confirmPane);

  let item: FeedbackItem | null = null;
  let pin: HTMLElement | null = null;
  let view: PopoverView = "view";
  let busy = false;
  let fading = false;
  let error: string | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;
  let listening: AbortController | null = null;

  function render() {
    if (!item) return;
    status.style.backgroundColor = statusColor(item.status);
    status.dataset.status = item.status;
    reviewer.textContent = item.reviewer.name;
    comment.textContent = item.comment;
    viewPane.hidden = view !== "view";
    editPane.hidden = view !== "edit";
    confirmPane.hidden = view !== "confirm-delete";
    errorMessage.hidden = error === null;
    errorMessage.textContent = error ?? "";
    textarea.disabled = busy;
    editCancelButton.disabled = busy;
    saveButton.disabled = busy || textarea.value.trim() === "";
    saveButton.setAttribute("aria-busy", String(busy && view === "edit"));
    confirmCancelButton.disabled = busy;
    confirmDeleteButton.disabled = busy;
    confirmDeleteButton.setAttribute(
      "aria-busy",
      String(busy && view === "confirm-delete"),
    );
  }

  function setView(next: PopoverView) {
    view = next;
    error = null;
    render();
  }

  function anchor() {
    if (pin) stopAutoUpdate = anchorBelow(pin, popover);
  }

  function freeze() {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  }

  function close() {
    freeze();
    listening?.abort();
    listening = null;
    if (fadeTimer !== null) clearTimeout(fadeTimer);
    fadeTimer = null;
    popover.classList.remove("fading");
    popover.remove();
    item = null;
    pin = null;
    busy = false;
    fading = false;
    error = null;
  }

  function dismiss() {
    if (!item || fading) return;
    // Frozen where it is: the pin may move or go away, the fading popover must not.
    freeze();
    listening?.abort();
    listening = null;
    fading = true;
    popover.classList.add("fading");
    fadeTimer = setTimeout(close, POPOVER_FADEOUT_MS);
    onClose();
  }

  async function run(action: (current: FeedbackItem) => Promise<void>) {
    const current = item;
    if (!current || busy) return;
    busy = true;
    error = null;
    render();
    try {
      await action(current);
    } catch (err) {
      if (item !== current) return;
      busy = false;
      error = err instanceof Error ? err.message : labels.errorMessage;
      render();
      if (!stopAutoUpdate) anchor();
      return;
    }
    if (item !== current) return;
    busy = false;
    dismiss();
  }

  function save() {
    const next = textarea.value.trim();
    if (!next) return;
    void run((current) => onSave(current, next));
  }

  function confirmDelete() {
    // The pin goes away with the Feedback, so the popover stops following it first.
    freeze();
    void run(onDelete);
  }

  closeButton.addEventListener("click", dismiss);
  editButton.addEventListener("click", () => {
    textarea.value = item?.comment ?? "";
    setView("edit");
    textarea.focus();
  });
  deleteButton.addEventListener("click", () => {
    setView("confirm-delete");
    confirmCancelButton.focus();
  });
  editCancelButton.addEventListener("click", () => {
    setView("view");
    editButton.focus();
  });
  confirmCancelButton.addEventListener("click", () => {
    setView("view");
    deleteButton.focus();
  });
  saveButton.addEventListener("click", save);
  confirmDeleteButton.addEventListener("click", confirmDelete);
  textarea.addEventListener("input", render);
  popover.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || busy) return;
    const returnTo = pin;
    dismiss();
    returnTo?.focus();
  });

  return {
    open(nextItem, nextPin) {
      close();
      item = nextItem;
      pin = nextPin;
      setView("view");
      container.appendChild(popover);
      anchor();
      listening = new AbortController();
      document.addEventListener(
        "mousedown",
        (event) => {
          if (!isWidgetEvent(event) && !busy) dismiss();
        },
        { capture: true, signal: listening.signal },
      );
      editButton.focus();
    },
    dismiss,
    sync(pinned) {
      if (!item || busy || fading) return;
      const current = item;
      const next = pinned.find((candidate) => candidate.id === current.id);
      if (!next) {
        close();
        onClose();
        return;
      }
      item = next;
      render();
    },
    close,
    get itemId() {
      return fading ? null : (item?.id ?? null);
    },
  };
}
