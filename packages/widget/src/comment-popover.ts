import type { Labels } from "@fasterfixes/core";

import {
  anchorBelow,
  createActionButton,
  POPOVER_FADEOUT_MS,
} from "./popover-shell.js";

type CommentPopoverActions = {
  /** Sends the comment; a rejection shows the error state. */
  onSubmit: (comment: string) => Promise<void>;
  /** The popover closed, by cancel, Escape or after a successful submit. */
  onClose: () => void;
};

export type CommentPopover = {
  open: (reference: Element) => void;
  close: () => void;
};

/**
 * The comment form anchored under the selected element. It stays anchored on
 * scroll and resize, and owns its submitting, error and fade-out states.
 */
export function createCommentPopover(
  document: Document,
  container: ShadowRoot,
  labels: Labels,
  { onSubmit, onClose }: CommentPopoverActions,
): CommentPopover {
  const popover = document.createElement("div");
  popover.className = "popover";
  popover.setAttribute("part", "popover");

  const form = document.createElement("div");
  const textarea = document.createElement("textarea");
  textarea.className = "textarea";
  textarea.setAttribute("part", "textarea");
  textarea.placeholder = labels.textareaPlaceholder;
  textarea.setAttribute("aria-label", labels.textareaPlaceholder);
  const formActions = document.createElement("div");
  formActions.className = "actions";
  const cancelButton = createActionButton(
    document,
    labels.cancelButton,
    "secondary",
  );
  const submitButton = createActionButton(
    document,
    labels.submitButton,
    "primary",
  );
  formActions.append(cancelButton, submitButton);
  form.append(textarea, formActions);

  const errorState = document.createElement("div");
  errorState.setAttribute("role", "alert");
  const errorMessage = document.createElement("p");
  errorMessage.className = "error-message";
  const errorActions = document.createElement("div");
  errorActions.className = "actions actions-start";
  const retryButton = createActionButton(
    document,
    labels.retryButton,
    "primary",
  );
  const errorCancelButton = createActionButton(
    document,
    labels.cancelButton,
    "secondary",
  );
  errorActions.append(retryButton, errorCancelButton);
  errorState.append(errorMessage, errorActions);

  popover.append(form, errorState);

  let stopAutoUpdate: (() => void) | null = null;
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;
  let submitting = false;
  let isOpen = false;

  function render() {
    const empty = textarea.value.trim() === "";
    textarea.disabled = submitting;
    cancelButton.disabled = submitting;
    submitButton.disabled = submitting || empty;
    submitButton.setAttribute("aria-busy", String(submitting));
  }

  function showError(message: string | null) {
    form.hidden = message !== null;
    errorState.hidden = message === null;
    errorMessage.textContent = message ?? "";
  }

  function teardown() {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    if (fadeTimer !== null) clearTimeout(fadeTimer);
    fadeTimer = null;
    popover.remove();
    popover.classList.remove("fading");
    isOpen = false;
    submitting = false;
  }

  function cancel() {
    if (!isOpen) return;
    teardown();
    onClose();
  }

  async function submit() {
    const comment = textarea.value.trim();
    if (!comment || submitting) return;
    submitting = true;
    showError(null);
    render();
    try {
      await onSubmit(comment);
    } catch (error) {
      if (!isOpen) return;
      submitting = false;
      render();
      showError(error instanceof Error ? error.message : labels.errorMessage);
      retryButton.focus();
      return;
    }
    if (!isOpen) return;
    // Frozen where it is: the element may move, the fading popover must not.
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    popover.classList.add("fading");
    fadeTimer = setTimeout(cancel, POPOVER_FADEOUT_MS);
  }

  textarea.addEventListener("input", render);
  cancelButton.addEventListener("click", cancel);
  errorCancelButton.addEventListener("click", cancel);
  submitButton.addEventListener("click", () => void submit());
  retryButton.addEventListener("click", () => void submit());
  popover.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cancel();
  });

  return {
    open(reference) {
      teardown();
      isOpen = true;
      textarea.value = "";
      showError(null);
      render();
      container.appendChild(popover);
      stopAutoUpdate = anchorBelow(reference, popover);
      textarea.focus();
    },
    close: teardown,
  };
}
