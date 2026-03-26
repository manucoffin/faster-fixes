import { useEffect } from "react";
import { useFeedbackContext } from "../context.js";
import { triggerButtonStyle, toolbarStyle, toolbarButtonStyle } from "../styles.js";

// Inject keyframes once
const STYLE_ID = "ff-widget-animations";
function ensureAnimationStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ff-toolbar-expand {
      0% {
        max-height: 40px;
        border-radius: 50%;
        opacity: 0.8;
      }
      100% {
        max-height: 200px;
        border-radius: 24px;
        opacity: 1;
      }
    }
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

  // Bottom/middle positions: toolbar grows upward, close button at bottom
  const expandsUp = position.includes("bottom") || position.includes("middle");

  useEffect(() => {
    ensureAnimationStyles();
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

  function handleClose() {
    setMode("idle");
    setShowList(false);
    setActiveFeedback(null);
    setSelectedElement(null);
    setClickCoords(null);
    setScreenshotBlob(null);
  }

  // Idle state: small circular button
  if (!isActive) {
    return (
      <button
        className={`ff-button ${classNames.button ?? ""}`}
        style={{
          ...triggerButtonStyle(),
          animation: "ff-button-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={handleTriggerClick}
        aria-label="Start feedback"
        type="button"
        data-ff-widget
      >
        <MessageIcon />
      </button>
    );
  }

  const listButton = (
    <button
      key="list"
      type="button"
      style={{
        ...toolbarButtonStyle,
        backgroundColor: showList
          ? "rgba(255,255,255,0.3)"
          : "rgba(255,255,255,0.15)",
      }}
      onClick={() => setShowList(!showList)}
      aria-label={showList ? "Hide feedback list" : "Show feedback list"}
      title={showList ? "Hide list" : "Show list"}
    >
      <ListIcon />
    </button>
  );

  const eyeButton = (
    <button
      key="eye"
      type="button"
      style={{
        ...toolbarButtonStyle,
        backgroundColor: showPins
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.3)",
      }}
      onClick={() => setShowPins(!showPins)}
      aria-label={showPins ? "Hide all feedback" : "Show all feedback"}
      title={showPins ? "Hide markers" : "Show markers"}
    >
      {showPins ? <EyeIcon /> : <EyeOffIcon />}
    </button>
  );

  const closeButton = (
    <button
      key="close"
      type="button"
      style={toolbarButtonStyle}
      onClick={handleClose}
      aria-label="Exit feedback mode"
      title="Close"
    >
      <CloseIcon />
    </button>
  );

  // Close button stays nearest to where the trigger button was
  const buttons = expandsUp
    ? [listButton, eyeButton, closeButton]
    : [closeButton, listButton, eyeButton];

  // Active state: expanded vertical toolbar
  return (
    <div
      className={`ff-button ${classNames.button ?? ""}`}
      style={{
        ...toolbarStyle(),
        animation: "ff-toolbar-expand 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
      data-ff-widget
    >
      {buttons}
    </div>
  );
}
