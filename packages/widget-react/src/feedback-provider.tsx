import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FasterFixesClient,
  DEFAULT_LABELS,
  resolveReviewerToken,
  resolveElement,
} from "@fasterfixes/core";
import type {
  FeedbackItem,
  Labels,
  SelectorStrategies,
  WidgetConfig,
  WidgetPosition,
} from "@fasterfixes/core";
import { FeedbackContext, type ClassNames, type WidgetMode } from "./context.js";
import { POSITION_STYLES } from "./styles.js";
import { FloatingButton } from "./components/floating-button.js";
import { AnnotationOverlay } from "./components/annotation-overlay.js";
import { CommentPopover } from "./components/comment-popover.js";
import { FeedbackPin } from "./components/feedback-pin.js";
import { PinPopover } from "./components/pin-popover.js";
import { FeedbackList } from "./components/feedback-list.js";
import { ElementHighlight } from "./components/element-highlight.js";

type FeedbackProviderProps = {
  apiKey: string;
  apiOrigin?: string;
  classNames?: Partial<ClassNames>;
  labels?: Partial<Labels>;
  children: React.ReactNode;
};

export function FeedbackProvider({
  apiKey,
  apiOrigin,
  classNames: customClassNames,
  labels: customLabels,
  children,
}: FeedbackProviderProps) {
  const [reviewerToken, setReviewerToken] = useState<string | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [initialized, setInitialized] = useState(false);
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
  const [highlightSelector, setHighlightSelector] = useState<string | null>(null);
  const screenshotCaptureRef = useRef<Promise<Blob | null> | null>(null);
  const pendingFeedbackHandled = useRef(false);
  const portalCleanupRef = useRef<(() => void) | null>(null);

  const client = useMemo(
    () => new FasterFixesClient({ apiKey, apiOrigin }),
    [apiKey, apiOrigin],
  );

  const mergedClassNames: ClassNames = { ...customClassNames };

  const mergedLabels: Labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...customLabels }),
    [customLabels],
  );

  // Fetch ALL feedback for the project (list shows all, pins filter by page)
  const refreshFeedback = useCallback(async () => {
    if (!reviewerToken) return;
    try {
      const res = await client.getFeedback(reviewerToken);
      setFeedbackItems(res.feedback);
    } catch {
      // Silently fail — pins just won't update
    }
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

    // Listen for browser back/forward
    window.addEventListener("popstate", checkUrl);

    // Poll for pushState/replaceState navigation (SPA frameworks)
    const interval = setInterval(checkUrl, 500);

    return () => {
      window.removeEventListener("popstate", checkUrl);
      clearInterval(interval);
    };
  }, []);

  // Initialization: token → config → feedback
  useEffect(() => {
    const token = resolveReviewerToken();
    if (!token) {
      setInitialized(true);
      return;
    }
    setReviewerToken(token);

    async function init() {
      try {
        const cfg = await client.getConfig();
        setConfig(cfg);

        if (!cfg.enabled) {
          setInitialized(true);
          return;
        }

        // Fetch all feedback for the project
        const res = await client.getFeedback(token!);
        setFeedbackItems(res.feedback);
      } catch {
        // Config/feedback fetch failed — widget won't render
      }
      setInitialized(true);
    }

    void init();
  }, [client]);

  // Open pending feedback after navigation (runs once after init + feedback load)
  useEffect(() => {
    if (!initialized || feedbackItems.length === 0 || pendingFeedbackHandled.current) return;
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
          const strategies = (pending.metadata as Record<string, unknown> | null)
            ?.selectors as SelectorStrategies | undefined;
          const el = resolveElement(pending.selector, strategies);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }, 100);
    } catch {
      // sessionStorage unavailable
    }
  }, [initialized, feedbackItems]);

  // Callback ref for the portal wrapper — sets up interaction protections
  // when the element mounts and cleans up when it unmounts.
  const portalRef = useCallback((el: HTMLDivElement | null) => {
    // Clean up previous
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

  // Don't render if not initialized, no token, or widget disabled
  if (!initialized || !reviewerToken || !config || !config.enabled) {
    return <>{children}</>;
  }

  const position = config.position as WidgetPosition;
  const posStyle = POSITION_STYLES[position] ?? POSITION_STYLES["bottom-right"];

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
    position,
    color: config.color,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      {isVisible &&
        createPortal(
          <div
            ref={portalRef}
            data-ff-widget
            style={{
              position: "relative",
              zIndex: 2147483647,
            }}
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
                flexDirection: position.includes("right")
                  ? "row-reverse"
                  : "row",
                alignItems: position.includes("bottom")
                  ? "flex-end"
                  : position.includes("top")
                    ? "flex-start"
                    : "center",
                gap: 8,
                zIndex: 2147483647,
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
