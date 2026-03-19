import { useFeedbackContext } from "../context.js";
import { floatingButtonStyle } from "../styles.js";

const MessageIcon = () => (
  <svg
    width="20"
    height="20"
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

const CrosshairIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

export function FloatingButton() {
  const { mode, setMode, color, classNames, setActiveFeedback, setSelectedElement, setClickCoords, setScreenshotBlob } =
    useFeedbackContext();

  const isAnnotating = mode === "annotating";

  function handleClick() {
    if (isAnnotating) {
      setMode("idle");
    } else {
      // Reset any previous selection state
      setActiveFeedback(null);
      setSelectedElement(null);
      setClickCoords(null);
      setScreenshotBlob(null);
      setMode("annotating");
    }
  }

  return (
    <button
      className={`ff-button ${classNames.button ?? ""}`}
      style={{
        ...floatingButtonStyle(isAnnotating ? "#64748b" : color),
        transform: isAnnotating ? "scale(0.9)" : "scale(1)",
      }}
      onClick={handleClick}
      aria-label={isAnnotating ? "Cancel annotation" : "Start feedback"}
      type="button"
    >
      {isAnnotating ? <CrosshairIcon /> : <MessageIcon />}
    </button>
  );
}
