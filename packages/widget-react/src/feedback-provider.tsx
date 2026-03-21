import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FasterFixesClient,
  DEFAULT_LABELS,
  resolveReviewerToken,
} from "@fasterfixes/core";
import type {
  FeedbackItem,
  Labels,
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
  const screenshotCaptureRef = useRef<Promise<Blob | null> | null>(null);

  const client = useMemo(
    () => new FasterFixesClient({ apiKey, apiOrigin }),
    [apiKey, apiOrigin],
  );

  const mergedClassNames: ClassNames = useMemo(
    () => ({ ...customClassNames }),
    [customClassNames],
  );

  const mergedLabels: Labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...customLabels }),
    [customLabels],
  );

  const refreshFeedback = useCallback(async () => {
    if (!reviewerToken) return;
    try {
      const res = await client.getFeedback(
        window.location.href,
        reviewerToken,
      );
      setFeedbackItems(res.feedback);
    } catch {
      // Silently fail — pins just won't update
    }
  }, [client, reviewerToken]);

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

        const res = await client.getFeedback(
          window.location.href,
          token!,
        );
        setFeedbackItems(res.feedback);
      } catch {
        // Config/feedback fetch failed — widget won't render
      }
      setInitialized(true);
    }

    void init();
  }, [client]);

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

  const visiblePins = showResolved
    ? feedbackItems
    : feedbackItems.filter(
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
    setFeedbackItems,
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
            data-ff-widget
            style={{
              position: "relative",
              zIndex: 2147483647,
            }}
          >
            {/* Annotation mode overlay */}
            <AnnotationOverlay />

            {/* Existing feedback pins (only when visible and active) */}
            {showPins &&
              visiblePins.map((item) => (
                <FeedbackPin key={item.id} item={item} />
              ))}

            {/* Toolbar + list container */}
            <div
              style={{
                position: "fixed",
                ...posStyle,
                display: "flex",
                flexDirection: "column",
                alignItems: position.includes("right")
                  ? "flex-end"
                  : "flex-start",
                zIndex: 2147483647,
                pointerEvents: "auto",
              }}
            >
              {isActive && showList && <FeedbackList />}
              <FloatingButton />
            </div>

            {/* Popovers rendered last so they appear above toolbar */}
            <CommentPopover />
            <PinPopover />
          </div>,
          document.body,
        )}
    </FeedbackContext.Provider>
  );
}
