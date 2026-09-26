import type { FeedbackItem } from "@fasterfixes/core";

export type Widget = {
  /** Shows the Widget after `hide()`. */
  show: () => void;
  /** Removes the Widget from the page until `show()`. */
  hide: () => void;
  readonly isVisible: boolean;
  /** Shows the Widget and enters annotation mode. */
  startAnnotation: () => void;
  /** Every Feedback item of the Project loaded so far. */
  readonly feedbackItems: readonly FeedbackItem[];
  /** Hides or shows every pin, like the markers control. */
  togglePins: () => void;
  readonly showPins: boolean;
  /** Unmounts the Widget and restores every global it patched. */
  destroy: () => void;
};

export function createInertWidget(): Widget {
  return {
    show: () => undefined,
    hide: () => undefined,
    isVisible: false,
    startAnnotation: () => undefined,
    feedbackItems: [],
    togglePins: () => undefined,
    showPins: true,
    destroy: () => undefined,
  };
}

export type DeferredWidget = {
  widget: Widget;
  /** Hands over to the mounted Widget once the config is known. */
  attach: (mounted: Widget) => void;
  readonly destroyed: boolean;
};

// `init` returns synchronously but mounts only after the config request, so
// the instance buffers `show`, `hide`, `startAnnotation` and `togglePins` and
// forwards them once attached.
export function createDeferredWidget(): DeferredWidget {
  let mounted: Widget | null = null;
  let wantsVisible = true;
  let wantsAnnotation = false;
  let wantsPins = true;
  let destroyed = false;

  const widget: Widget = {
    show() {
      if (destroyed) return;
      wantsVisible = true;
      mounted?.show();
    },
    hide() {
      if (destroyed) return;
      wantsVisible = false;
      wantsAnnotation = false;
      mounted?.hide();
    },
    startAnnotation() {
      if (destroyed) return;
      wantsVisible = true;
      if (mounted) mounted.startAnnotation();
      else wantsAnnotation = true;
    },
    get isVisible() {
      return mounted?.isVisible ?? false;
    },
    get feedbackItems() {
      return mounted?.feedbackItems ?? [];
    },
    togglePins() {
      if (destroyed) return;
      if (mounted) mounted.togglePins();
      else wantsPins = !wantsPins;
    },
    get showPins() {
      return mounted?.showPins ?? wantsPins;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      mounted?.destroy();
      mounted = null;
    },
  };

  return {
    widget,
    attach(next) {
      if (destroyed || mounted) {
        next.destroy();
        return;
      }
      mounted = next;
      if (!wantsVisible) next.hide();
      if (wantsAnnotation) next.startAnnotation();
      if (next.showPins !== wantsPins) next.togglePins();
    },
    get destroyed() {
      return destroyed;
    },
  };
}
