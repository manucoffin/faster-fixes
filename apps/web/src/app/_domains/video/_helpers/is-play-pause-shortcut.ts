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

type ShortcutOptions = {
  /**
   * The dialog the player fills, which does not keep Space from its own
   * player. A field, menu or dialog inside or over it still does.
   */
  surface?: Element | null;
};

/**
 * Whether a key press should play or pause the Video. A focused button does
 * not keep Space, so a press after clicking a control still toggles playback.
 */
export function isPlayPauseShortcut(
  event: ShortcutKeyEvent,
  { surface = null }: ShortcutOptions = {},
) {
  if (event.key !== " " || event.repeat || event.defaultPrevented) return false;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }
  if (!hasClosest(event.target)) return true;
  const owner = event.target.closest(SPACE_OWNERS);
  return owner === null || owner === surface;
}
