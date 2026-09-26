import { createDiagnosticsRecorder } from "@fasterfixes/core";
import type {
  DiagnosticsRecorder,
  FeedbackClient,
  FeedbackItem,
  WidgetPosition,
} from "@fasterfixes/core";

import { createAnnotationMode } from "./annotation.js";
import { createCommentPopover } from "./comment-popover.js";
import { createFeedbackList } from "./feedback-list.js";
import { buildFeedbackPayload } from "./feedback-payload.js";
import type { Widget } from "./instance.js";
import type { ResolvedDisplayOptions } from "./options.js";
import type { PinPoint } from "./pin-placement.js";
import { createPinPopover } from "./pin-popover.js";
import { createPinLayer, resolveTarget } from "./pins.js";
import { getPositionStyle } from "./position.js";
import { captureViewportScreenshot } from "./screenshot.js";
import { settleScreenshot } from "./screenshot-fallback.js";
import { WIDGET_CSS } from "./styles.js";
import { createToolbar } from "./toolbar.js";

type MountInput = {
  options: ResolvedDisplayOptions;
  client: FeedbackClient;
  reviewerToken: string;
  /** Whether the Project's config asks for the product link in the list. */
  branding: boolean;
};

// `selected` covers the comment popover in every state: typing, submitting, error.
type WidgetMode = "idle" | "annotating" | "selected";

// Resolved and closed Feedback stay in the list but get no pin.
function isOpenOnPage(item: FeedbackItem, url: string) {
  return (
    item.pageUrl === url &&
    item.status !== "resolved" &&
    item.status !== "closed"
  );
}

function stackAlignment(position: WidgetPosition) {
  if (position.includes("bottom")) return "flex-end";
  if (position.includes("top")) return "flex-start";
  return "center";
}

// The stack hugs the screen edge it is anchored to, and grows away from it.
function applyStackLayout(stack: HTMLElement, position: WidgetPosition) {
  Object.assign(stack.style, getPositionStyle(position));
  stack.style.flexDirection = position.includes("right")
    ? "row-reverse"
    : "row";
  stack.style.alignItems = stackAlignment(position);
}

/**
 * Renders the Widget into an open shadow root on a light-DOM host appended to
 * `document.body`. The caller has already decided the Widget should mount.
 */
export function mountWidget({
  options,
  client,
  reviewerToken,
  branding,
}: MountInput): Widget {
  const host = document.createElement("div");
  host.setAttribute("data-ff-widget", "");
  host.style.setProperty("--ff-accent", options.color);

  const shadow = host.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(WIDGET_CSS);
  shadow.adoptedStyleSheets = [sheet];

  // Starts at mount, stops on destroy: an opted-out site never patches globals.
  let recorder: DiagnosticsRecorder | null = null;
  if (options.captureDiagnostics) {
    recorder = createDiagnosticsRecorder({ apiOrigin: options.apiOrigin });
    recorder.start();
  }

  let mode: WidgetMode = "idle";
  let selection: {
    element: Element;
    click: PinPoint;
    screenshot: Promise<Blob | null>;
  } | null = null;

  function setMode(next: WidgetMode) {
    mode = next;
    // Annotating and commenting take over the page; a pin popover would sit in the way.
    if (next !== "idle") closePinPopover();
    toolbar.setActive(next !== "idle");
    if (next === "idle") setListOpen(false);
    if (next === "annotating") annotation.start();
    else annotation.stop();
    if (next !== "selected") {
      selection = null;
      popover.close();
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.setAttribute("part", "overlay");
  overlay.hidden = true;

  const highlight = document.createElement("div");
  highlight.className = "highlight";
  highlight.hidden = true;
  shadow.appendChild(highlight);

  const pinLayer = createPinLayer(
    document,
    shadow,
    options.labels,
    highlight,
    (item, pin) => {
      if (pinPopover.itemId === item.id) {
        pinPopover.dismiss();
        return;
      }
      // Leaves the comment popover but stays in feedback mode, like the React Embed.
      if (mode === "selected") setMode("annotating");
      openPinPopover(item, pin);
    },
  );
  let feedbackItems: FeedbackItem[] = [];
  let showPins = true;

  function setFeedbackItems(next: FeedbackItem[]) {
    feedbackItems = next;
    const pinned = next.filter((item) =>
      isOpenOnPage(item, window.location.href),
    );
    pinLayer.render(pinned);
    pinPopover.sync(pinned);
    list.render(next);
  }

  const pinPopover = createPinPopover(document, shadow, options.labels, {
    async onSave(item, comment) {
      await client.updateFeedback(item.id, { comment }, reviewerToken);
      if (destroyed) return;
      setFeedbackItems(
        feedbackItems.map((current) =>
          current.id === item.id ? { ...current, comment } : current,
        ),
      );
      void loadFeedback();
    },
    async onDelete(item) {
      await client.deleteFeedback(item.id, reviewerToken);
      if (destroyed) return;
      setFeedbackItems(feedbackItems.filter(({ id }) => id !== item.id));
      void loadFeedback();
    },
    onClose: () => pinLayer.setActive(null),
  });

  function openPinPopover(item: FeedbackItem, pin: HTMLElement) {
    pinPopover.open(item, pin);
    pinLayer.setActive(item);
  }

  function closePinPopover() {
    pinPopover.close();
    pinLayer.setActive(null);
  }

  async function loadFeedback() {
    try {
      const { feedback } = await client.getFeedback(reviewerToken);
      if (!destroyed) setFeedbackItems(feedback);
    } catch {
      // The Widget works without pins when the list cannot be loaded
    }
  }

  // Best-effort and never awaited by the submit: a missing screenshot is not an error.
  async function attachScreenshot(
    feedbackId: string,
    pending: Promise<Blob | null>,
  ) {
    const screenshot = await settleScreenshot(
      pending,
      captureViewportScreenshot,
    );
    if (!screenshot) return;
    try {
      await client.attachScreenshot(feedbackId, screenshot, reviewerToken);
      if (!destroyed) void loadFeedback();
    } catch (err) {
      console.warn("[faster-fixes] screenshot upload failed:", err);
    }
  }

  const annotation = createAnnotationMode(document, overlay, {
    onSelect(element, click) {
      setMode("selected");
      // Started before the popover opens; the host is excluded from the capture either way.
      selection = { element, click, screenshot: captureViewportScreenshot() };
      popover.open(element);
    },
    onCancel: () => setMode("idle"),
  });

  const popover = createCommentPopover(document, shadow, options.labels, {
    async onSubmit(comment) {
      if (!selection) return;
      const { screenshot } = selection;
      const created = await client.createFeedback(
        buildFeedbackPayload({
          comment,
          element: selection.element,
          click: selection.click,
          diagnosticTrail: recorder?.snapshot(),
        }),
        reviewerToken,
      );
      void attachScreenshot(created.id, screenshot);
      if (destroyed) return;
      setFeedbackItems([...feedbackItems, created]);
      void loadFeedback();
    },
    onClose() {
      if (mode === "selected") setMode("idle");
    },
  });

  const list = createFeedbackList(
    document,
    { labels: options.labels, position: options.position, branding },
    {
      onSelect(item) {
        // Cross-page rows are handled with in-app navigation, not here yet.
        if (item.pageUrl !== window.location.href) return;
        if (mode === "selected") setMode("annotating");
        resolveTarget(item)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        const pin = showPins ? pinLayer.pinOf(item.id) : null;
        if (pin) {
          openPinPopover(item, pin);
          return;
        }
        // Resolved and closed items have no pin: only their element is outlined.
        pinPopover.close();
        pinLayer.setActive(item);
      },
    },
  );

  function setListOpen(open: boolean) {
    list.setOpen(open);
    toolbar.setListShown(open);
  }

  const toolbar = createToolbar(document, options, {
    onStart: () => setMode("annotating"),
    onExit: () => setMode("idle"),
    onTogglePins: togglePins,
    onToggleList: () => setListOpen(!list.isOpen),
  });
  toolbar.setListShown(false);

  const stack = document.createElement("div");
  stack.className = "stack";
  applyStackLayout(stack, options.position);
  stack.append(toolbar.element, list.element);
  shadow.append(overlay, stack);

  let visible = true;
  let destroyed = false;
  document.body.appendChild(host);
  void loadFeedback();

  function togglePins() {
    showPins = !showPins;
    if (!showPins) closePinPopover();
    pinLayer.setShown(showPins);
    toolbar.setPinsShown(showPins);
  }

  function show() {
    if (destroyed || visible) return;
    visible = true;
    document.body.appendChild(host);
  }

  return {
    show,
    hide() {
      if (destroyed || !visible) return;
      visible = false;
      setMode("idle");
      closePinPopover();
      list.close();
      host.remove();
    },
    get isVisible() {
      return visible && !destroyed;
    },
    startAnnotation() {
      if (destroyed) return;
      show();
      setMode("annotating");
    },
    get feedbackItems() {
      return feedbackItems;
    },
    togglePins() {
      if (!destroyed) togglePins();
    },
    get showPins() {
      return showPins;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      setMode("idle");
      closePinPopover();
      list.close();
      recorder?.stop();
      recorder = null;
      pinLayer.destroy();
      host.remove();
    },
  };
}
