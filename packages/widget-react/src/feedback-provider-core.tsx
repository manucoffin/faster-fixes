import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  createDiagnosticsRecorder,
  DEFAULT_API_ORIGIN,
  DEFAULT_LABELS,
  DEFAULT_WIDGET_COLOR,
  DEFAULT_WIDGET_POSITION,
  resolveElement,
} from "@fasterfixes/core";
import type {
  DiagnosticsRecorder,
  FeedbackClient,
  FeedbackItem,
  Labels,
  SelectorStrategies,
  WidgetConfig,
  WidgetPosition,
} from "@fasterfixes/core";
import { FeedbackContext, type ClassNames } from "./context.js";
import type { WidgetMode } from "./context.js";
import { POSITION_STYLES, Z_WIDGET } from "./styles.js";
import { FloatingButton } from "./components/floating-button.js";
import { AnnotationOverlay } from "./components/annotation-overlay.js";
import { CommentPopover } from "./components/comment-popover.js";
import { FeedbackPin } from "./components/feedback-pin.js";
import { PinPopover } from "./components/pin-popover.js";
import { FeedbackList } from "./components/feedback-list.js";
import { ElementHighlight } from "./components/element-highlight.js";

export type FeedbackProviderCoreProps = {
  client: FeedbackClient;
  reviewerToken: string;
  config: WidgetConfig;
  color?: string;
  position?: WidgetPosition;
  classNames?: Partial<ClassNames>;
  labels?: Partial<Labels>;
  captureDiagnostics?: boolean;
  apiOrigin?: string;
  children: React.ReactNode;
};

/**
 * @unstable Internal API. No semver guarantees. May change or be removed in
 * any release. Used by the FasterFixes marketing demo and intended for
 * advanced integrators who need a custom storage backend (e.g. localStorage
 * for offline development or e2e tests).
 *
 * Renders the widget given a pre-resolved `client`, `reviewerToken`, and
 * `config`. The public `FeedbackProvider` is a thin wrapper that performs
 * the cookie/HTTP init dance and then renders this component.
 */
export function FeedbackProviderCore({
  client,
  reviewerToken,
  config,
  color,
  position,
  classNames: customClassNames,
  labels: customLabels,
  captureDiagnostics = true,
  apiOrigin = DEFAULT_API_ORIGIN,
  children,
}: FeedbackProviderCoreProps) {
  const [mode, setMode] = useState<WidgetMode>("idle");
  const [isVisible, setIsVisible] = useState(true);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.href : "",
  );
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [clickCoords, setClickCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<FeedbackItem | null>(
    null,
  );
  const [showResolved, setShowResolved] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [showList, setShowList] = useState(false);
  const [highlightSelector, setHighlightSelector] = useState<string | null>(
    null,
  );
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const screenshotCaptureRef = useRef<Promise<Blob | null> | null>(null);
  const pendingFeedbackHandled = useRef(false);
  const portalCleanupRef = useRef<(() => void) | null>(null);
  const recorderRef = useRef<DiagnosticsRecorder | null>(null);

  const effectiveColor = color ?? DEFAULT_WIDGET_COLOR;
  const effectivePosition = position ?? DEFAULT_WIDGET_POSITION;

  const mergedClassNames: ClassNames = customClassNames ?? {};

  const mergedLabels: Labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...customLabels }),
    [customLabels],
  );

  const refreshFeedback = useCallback(async () => {
    try {
      const res = await client.getFeedback(reviewerToken);
      setFeedbackItems(res.feedback);
    } catch {
      // Silently fail — pins just won't update
    }
  }, [client, reviewerToken]);

  // Snapshot the recorder's ring buffers at submit time; undefined when capture
  // is disabled or the recorder has not started.
  const getDiagnosticTrail = useCallback(
    () => recorderRef.current?.snapshot(),
    [],
  );

  // The portal mounts to document.body, which is unavailable during SSR.
  // Defer all DOM-touching render until after hydration.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Diagnostic Trail: instrument console + network for the lifetime of the
  // widget. Gated by captureDiagnostics so an opted-out site never patches
  // globals. Starts at mount — activity before hydration is not captured.
  useEffect(() => {
    if (!captureDiagnostics || typeof window === "undefined") return;
    const recorder = createDiagnosticsRecorder({ apiOrigin });
    recorder.start();
    recorderRef.current = recorder;
    return () => {
      recorder.stop();
      recorderRef.current = null;
    };
  }, [captureDiagnostics, apiOrigin]);

  // Initial feedback load
  useEffect(() => {
    let cancelled = false;
    // Not an IIFE: TypeScript would narrow `cancelled` to false inside it and miss the cleanup
    const loadFeedback = async () => {
      try {
        const res = await client.getFeedback(reviewerToken);
        if (!cancelled) {
          setFeedbackItems(res.feedback);
        }
      } catch {
        // Silently fail — widget renders with no pins
      } finally {
        if (!cancelled) setFeedbackLoaded(true);
      }
    };
    void loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [client, reviewerToken]);

  // Detect URL changes (SPA navigation)
  useEffect(() => {
    function checkUrl() {
      const href = window.location.href;
      setCurrentUrl((prev) => {
        if (prev !== href) {
          // Clear active pin when navigating
          setActiveFeedback(null);
          setHighlightSelector(null);
          return href;
        }
        return prev;
      });
    }

    window.addEventListener("popstate", checkUrl);
    const interval = setInterval(checkUrl, 500);

    return () => {
      window.removeEventListener("popstate", checkUrl);
      clearInterval(interval);
    };
  }, []);

  // Open pending feedback after navigation (runs once after feedback loads)
  useEffect(() => {
    if (
      !feedbackLoaded ||
      feedbackItems.length === 0 ||
      pendingFeedbackHandled.current
    ) {
      return;
    }
    try {
      const pendingId = sessionStorage.getItem("ff_pending_feedback");
      if (!pendingId) return;
      sessionStorage.removeItem("ff_pending_feedback");
      pendingFeedbackHandled.current = true;

      const pending = feedbackItems.find((f) => f.id === pendingId);
      if (!pending) return;

      // Delay to let page layout stabilize
      setTimeout(() => {
        setActiveFeedback(pending);
        setHighlightSelector(pending.selector ?? null);

        setTimeout(() => {
          const strategies = (
            pending.metadata as Record<string, unknown> | null
          )?.selectors as SelectorStrategies | undefined;
          const el = resolveElement(pending.selector, strategies);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }, 100);
    } catch {
      // sessionStorage unavailable
    }
  }, [feedbackLoaded, feedbackItems]);

  // Callback ref for the portal wrapper — sets up interaction protections
  // when the element mounts and cleans up when it unmounts.
  const portalRef = useCallback((el: HTMLDivElement | null) => {
    if (portalCleanupRef.current) {
      portalCleanupRef.current();
      portalCleanupRef.current = null;
    }

    if (!el) return;

    // --- Prevent dialog libraries from blocking widget interaction ---

    // 1. Stop native event propagation so dialog focus traps and
    //    click-outside handlers in the bubble phase can't see our events.
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("focusin", stop);
    el.addEventListener("pointerdown", stop);
    el.addEventListener("mousedown", stop);

    // 2. Strip inert/aria-hidden attributes that dialog libraries set
    //    on sibling elements to block interaction.
    const attrObserver = new MutationObserver(() => {
      if (el.hasAttribute("inert")) el.removeAttribute("inert");
      if (el.getAttribute("aria-hidden") === "true") {
        el.removeAttribute("aria-hidden");
      }
    });
    attrObserver.observe(el, {
      attributes: true,
      attributeFilter: ["inert", "aria-hidden"],
    });

    // 3. Re-focus mechanism for capture-phase focus traps that our
    //    stopPropagation can't intercept. If focus is stolen from a
    //    widget input, we immediately re-focus it.
    const handleDocumentFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget;
      if (relatedTarget instanceof Element && el.contains(relatedTarget)) {
        e.stopImmediatePropagation();
      }
    };

    let refocusing = false;
    const handleFocusOut = (e: FocusEvent) => {
      if (refocusing) return;
      const target = e.target as HTMLElement | null;
      const relatedTarget = e.relatedTarget as Element | null;
      if (
        target?.matches("textarea, input, [contenteditable]") &&
        (!relatedTarget || !el.contains(relatedTarget))
      ) {
        refocusing = true;
        requestAnimationFrame(() => {
          target.focus();
          refocusing = false;
        });
      }
    };
    el.addEventListener("focusout", handleFocusOut);
    el.ownerDocument.addEventListener("focusout", handleDocumentFocusOut);

    // Strip on mount in case a dialog is already open
    if (el.hasAttribute("inert")) el.removeAttribute("inert");
    if (el.getAttribute("aria-hidden") === "true") {
      el.removeAttribute("aria-hidden");
    }

    portalCleanupRef.current = () => {
      el.removeEventListener("focusin", stop);
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("focusout", handleFocusOut);
      el.ownerDocument.removeEventListener("focusout", handleDocumentFocusOut);
      attrObserver.disconnect();
    };
  }, []);

  // why: a JS consumer can pass a position outside WidgetPosition
  const positionStyles: Partial<Record<string, React.CSSProperties>> =
    POSITION_STYLES;
  const posStyle =
    positionStyles[effectivePosition] ?? POSITION_STYLES["bottom-right"];

  const show = () => setIsVisible(true);
  const hide = () => {
    setIsVisible(false);
    setMode("idle");
    setActiveFeedback(null);
    setSelectedElement(null);
    setShowList(false);
  };

  // Pins: only show feedback for the current page
  const currentPageItems = feedbackItems.filter(
    (f) => f.pageUrl === currentUrl,
  );
  const visiblePins = showResolved
    ? currentPageItems
    : currentPageItems.filter(
        (f) => f.status !== "resolved" && f.status !== "closed",
      );

  const isActive = mode !== "idle";

  const contextValue = {
    client,
    reviewerToken,
    config,
    mode,
    setMode,
    isVisible,
    show,
    hide,
    feedbackItems,
    refreshFeedback,
    getDiagnosticTrail,
    selectedElement,
    setSelectedElement,
    clickCoords,
    setClickCoords,
    screenshotBlob,
    setScreenshotBlob,
    activeFeedback,
    setActiveFeedback,
    showResolved,
    setShowResolved,
    showPins,
    setShowPins,
    showList,
    setShowList,
    highlightSelector,
    setHighlightSelector,
    screenshotCaptureRef,
    classNames: mergedClassNames,
    labels: mergedLabels,
    position: effectivePosition,
    color: effectiveColor,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      {mounted &&
        isVisible &&
        createPortal(
          <div
            ref={portalRef}
            data-ff-widget
            style={
              {
                display: "contents",
                "--ff-accent": effectiveColor,
              } as React.CSSProperties
            }
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <AnnotationOverlay />
            <ElementHighlight />

            {showPins &&
              visiblePins.map((item) => (
                <FeedbackPin key={item.id} item={item} />
              ))}

            <div
              style={{
                position: "fixed",
                ...posStyle,
                display: "flex",
                flexDirection: effectivePosition.includes("right")
                  ? "row-reverse"
                  : "row",
                alignItems: stackAlignment(effectivePosition),
                gap: 8,
                zIndex: Z_WIDGET,
                pointerEvents: "auto",
              }}
            >
              <FloatingButton />
              {isActive && <FeedbackList />}
            </div>

            <CommentPopover />
            <PinPopover />
          </div>,
          document.body,
        )}
    </FeedbackContext.Provider>
  );
}

// The widget stack hugs the screen edge it is anchored to.
function stackAlignment(position: string) {
  if (position.includes("bottom")) return "flex-end";
  if (position.includes("top")) return "flex-start";
  return "center";
}
