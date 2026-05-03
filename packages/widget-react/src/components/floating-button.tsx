import { useEffect, useRef, useState } from "react";
import { useFeedbackContext } from "../context.js";
import { toolbarStyle, toolbarButtonStyle } from "../styles.js";

// Inject keyframes once
const STYLE_ID = "ff-widget-animations";
function ensureAnimationStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ff-button-pop {
      from { transform: scale(0.6); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes ff-list-slide-left {
      from { transform: translateX(12px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes ff-list-slide-right {
      from { transform: translateX(-12px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes ff-popover-fadeout {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(8px); opacity: 0; }
    }
    @keyframes ff-list-exit-left {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(12px); opacity: 0; }
    }
    @keyframes ff-list-exit-right {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-12px); opacity: 0; }
    }
    .ff-toolbar-trigger-content,
    .ff-toolbar-controls-content {
      position: absolute;
      inset: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        opacity 150ms ease,
        transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
        filter 220ms ease;
    }
    .ff-toolbar-trigger-content[data-visible="false"] {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.72);
    }
    .ff-toolbar-controls-content {
      flex-direction: column;
      gap: 4px;
    }
    .ff-toolbar-controls-content[data-visible="false"] {
      opacity: 0;
      pointer-events: none;
      filter: blur(6px);
      transform: scale(0.72) translateY(6px);
    }
    .ff-toolbar-controls-content[data-visible="true"] {
      opacity: 1;
      pointer-events: auto;
      filter: blur(0);
      transform: scale(1) translateY(0);
    }
    .ff-toolbar-button-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ff-toolbar-tooltip {
      position: absolute;
      top: 50%;
      width: max-content;
      max-width: 180px;
      padding: 6px 8px;
      border-radius: 6px;
      background: #18181b;
      color: #f4f4f5;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
      font: 500 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      z-index: 2147483647;
      transition:
        opacity 130ms ease,
        transform 130ms ease,
        visibility 130ms ease;
      transition-delay: 650ms;
    }
    .ff-tooltip-left .ff-toolbar-tooltip {
      right: calc(100% + 10px);
      transform: translate(4px, -50%) scale(0.96);
    }
    .ff-tooltip-right .ff-toolbar-tooltip {
      left: calc(100% + 10px);
      transform: translate(-4px, -50%) scale(0.96);
    }
    .ff-tooltip-left:hover .ff-toolbar-tooltip {
      transform: translate(0, -50%) scale(1);
    }
    .ff-tooltip-right:hover .ff-toolbar-tooltip {
      transform: translate(0, -50%) scale(1);
    }
    .ff-toolbar-button-wrap:hover .ff-toolbar-tooltip {
      opacity: 1;
      visibility: visible;
    }
    .ff-toolbar-tooltip-session .ff-toolbar-button-wrap:hover .ff-toolbar-tooltip {
      transition-delay: 0ms;
    }
    .ff-toolbar-tooltips-hidden .ff-toolbar-tooltip {
      opacity: 0 !important;
      visibility: hidden !important;
      transition: none !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .ff-toolbar-trigger-content,
      .ff-toolbar-controls-content,
      .ff-toolbar-tooltip {
        transition-duration: 1ms !important;
        transform: none !important;
        filter: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

const MessageIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type ToolbarControlProps = {
  label: string;
  tooltipSide: "left" | "right";
  interaction: "enabled" | "disabled";
  tone?: "active" | "normal";
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarControl({
  label,
  tooltipSide,
  interaction,
  tone,
  onClick,
  children,
}: ToolbarControlProps) {
  const isEnabled = interaction === "enabled";

  return (
    <span className={`ff-toolbar-button-wrap ff-tooltip-${tooltipSide}`}>
      <button
        type="button"
        style={{
          ...toolbarButtonStyle,
          backgroundColor: tone === "active"
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.15)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEnabled) return;
          onClick();
        }}
        tabIndex={isEnabled ? 0 : -1}
        aria-label={label}
      >
        {children}
      </button>
      <span className="ff-toolbar-tooltip">{label}</span>
    </span>
  );
}

export function FloatingButton() {
  const {
    mode,
    setMode,
    classNames,
    setActiveFeedback,
    setSelectedElement,
    setClickCoords,
    setScreenshotBlob,
    showPins,
    setShowPins,
    showList,
    setShowList,
    position,
  } = useFeedbackContext();
  const [tooltipsHidden, setTooltipsHidden] = useState(false);
  const [tooltipSessionActive, setTooltipSessionActive] = useState(false);
  const tooltipSessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Bottom/middle positions: toolbar grows upward, close button at bottom
  const expandsUp = position.includes("bottom") || position.includes("middle");
  const tooltipSide = position.includes("left") ? "right" : "left";

  useEffect(() => {
    ensureAnimationStyles();
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipSessionTimerRef.current !== null) {
        clearTimeout(tooltipSessionTimerRef.current);
      }
    };
  }, []);

  const isActive = mode !== "idle";

  function handleTriggerClick() {
    if (isActive) return;
    setActiveFeedback(null);
    setSelectedElement(null);
    setClickCoords(null);
    setScreenshotBlob(null);
    setMode("annotating");
  }

  function handleShellKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isActive) return;
    if (e.key !== "Enter" && e.key !== " ") return;

    e.preventDefault();
    handleTriggerClick();
  }

  function handleClose() {
    setMode("idle");
    setShowList(false);
    setActiveFeedback(null);
    setSelectedElement(null);
    setClickCoords(null);
    setScreenshotBlob(null);
  }

  function handleToolbarMouseEnter() {
    if (tooltipSessionActive || tooltipSessionTimerRef.current !== null) return;

    tooltipSessionTimerRef.current = setTimeout(() => {
      tooltipSessionTimerRef.current = null;
      setTooltipSessionActive(true);
    }, 650);
  }

  function handleToolbarMouseLeave() {
    if (tooltipSessionTimerRef.current !== null) {
      clearTimeout(tooltipSessionTimerRef.current);
      tooltipSessionTimerRef.current = null;
    }
    setTooltipSessionActive(false);
    setTooltipsHidden(false);
  }

  function runToolbarAction(action: () => void) {
    setTooltipsHidden(true);
    action();
  }

  const listButton = (
    <ToolbarControl
      key="list"
      label={showList ? "Hide feedback list" : "Show feedback list"}
      tooltipSide={tooltipSide}
      interaction={isActive ? "enabled" : "disabled"}
      tone={showList ? "active" : "normal"}
      onClick={() => runToolbarAction(() => setShowList(!showList))}
    >
      <ListIcon />
    </ToolbarControl>
  );

  const eyeButton = (
    <ToolbarControl
      key="eye"
      label={showPins ? "Hide markers" : "Show markers"}
      tooltipSide={tooltipSide}
      interaction={isActive ? "enabled" : "disabled"}
      tone={!showPins ? "active" : "normal"}
      onClick={() => runToolbarAction(() => setShowPins(!showPins))}
    >
      {showPins ? <EyeIcon /> : <EyeOffIcon />}
    </ToolbarControl>
  );

  const closeButton = (
    <ToolbarControl
      key="close"
      label="Exit feedback mode"
      tooltipSide={tooltipSide}
      interaction={isActive ? "enabled" : "disabled"}
      onClick={() => runToolbarAction(handleClose)}
    >
      <CloseIcon />
    </ToolbarControl>
  );

  // Close button stays nearest to where the trigger button was
  const buttons = expandsUp
    ? [listButton, eyeButton, closeButton]
    : [closeButton, listButton, eyeButton];

  return (
    <div
      className={`ff-button ff-toolbar-shell ${classNames.button ?? ""}`}
      style={{
        ...toolbarStyle(isActive ? "expanded" : "collapsed"),
        animation: "ff-button-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      onClick={!isActive ? handleTriggerClick : undefined}
      onKeyDown={handleShellKeyDown}
      onMouseEnter={handleToolbarMouseEnter}
      onMouseLeave={handleToolbarMouseLeave}
      role={!isActive ? "button" : undefined}
      tabIndex={!isActive ? 0 : undefined}
      aria-label={!isActive ? "Start feedback" : undefined}
      data-ff-widget
    >
      <div
        className="ff-toolbar-trigger-content"
        data-visible={!isActive}
        aria-hidden={isActive}
      >
        <MessageIcon />
      </div>
      <div
        className={`ff-toolbar-controls-content ${
          tooltipSessionActive ? "ff-toolbar-tooltip-session" : ""
        } ${tooltipsHidden ? "ff-toolbar-tooltips-hidden" : ""}`}
        data-visible={isActive}
        aria-hidden={!isActive}
      >
        {buttons}
      </div>
    </div>
  );
}
