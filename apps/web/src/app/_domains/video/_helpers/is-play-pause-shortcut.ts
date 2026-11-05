type ShortcutKeyEvent = Pick<
  KeyboardEvent,
  | "key"
  | "repeat"
  | "defaultPrevented"
  | "altKey"
  | "ctrlKey"
  | "metaKey"
  | "shiftKey"
  | "target"
>;

// Space belongs to these: typing, toggling a control, or a dialog or menu the
// user is working in.
const SPACE_OWNERS = [
  "input",
  "textarea",
  "select",
  '[contenteditable]:not([contenteditable="false"])',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
].join(", ");

function hasClosest(
  target: EventTarget | null,
): target is EventTarget & Pick<Element, "closest"> {
  return target !== null && "closest" in target;
}

/**
 * Whether a key press should play or pause the Video. A focused button does
 * not keep Space, so a press after clicking a control still toggles playback.
 */
export function isPlayPauseShortcut(event: ShortcutKeyEvent) {
  if (event.key !== " " || event.repeat || event.defaultPrevented) return false;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }
  if (!hasClosest(event.target)) return true;
  return event.target.closest(SPACE_OWNERS) === null;
}
