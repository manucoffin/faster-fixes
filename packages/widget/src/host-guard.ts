const EDITABLE = "textarea, input, [contenteditable]";

// Modal dialog libraries set these on every sibling of their portal, which
// includes the host: the Widget would become unreachable and unannounced.
function stripBlockingAttributes(host: HTMLElement) {
  if (host.hasAttribute("inert")) host.removeAttribute("inert");
  if (host.getAttribute("aria-hidden") === "true") {
    host.removeAttribute("aria-hidden");
  }
}

/**
 * Keeps the Widget usable while the page has a modal dialog open that traps
 * focus or closes on outside interaction. Returns the teardown.
 */
export function guardHost(host: HTMLElement, shadow: ShadowRoot): () => void {
  const view = host.ownerDocument.defaultView ?? window;
  const listening = new AbortController();
  const { signal } = listening;

  // Stopped on the window in the capture phase, before any page listener in
  // either phase, so neither a focus trap nor an outside-click handler learns
  // that the Reviewer is using the Widget. This also hides these three events
  // from listeners inside the shadow root: the Widget must not rely on them.
  const stopWidgetEvent = (event: Event) => {
    if (event.target instanceof Node && host.contains(event.target)) {
      event.stopPropagation();
    }
  };
  for (const type of ["focusin", "pointerdown", "mousedown"]) {
    view.addEventListener(type, stopWidgetEvent, { capture: true, signal });
  }

  // A trap reads `relatedTarget` on focusout to pull focus back into its
  // dialog when focus leaves for the Widget.
  view.addEventListener(
    "focusout",
    (event) => {
      const { relatedTarget } = event;
      if (relatedTarget instanceof Node && host.contains(relatedTarget)) {
        event.stopPropagation();
      }
    },
    { capture: true, signal },
  );

  // Capture-phase traps still move focus away; the field takes it straight back.
  let refocusing = false;
  shadow.addEventListener(
    "focusout",
    (event) => {
      if (refocusing) return;
      const { target, relatedTarget } = event as FocusEvent;
      if (!(target instanceof HTMLElement) || !target.matches(EDITABLE)) return;
      if (relatedTarget instanceof Node && shadow.contains(relatedTarget)) {
        return;
      }
      refocusing = true;
      view.requestAnimationFrame(() => {
        refocusing = false;
        // A submit or cancel removes or hides the field: nothing to hold.
        if (target.isConnected && target.offsetParent !== null) target.focus();
      });
    },
    { signal },
  );

  const observer = new MutationObserver(() => stripBlockingAttributes(host));
  observer.observe(host, {
    attributes: true,
    attributeFilter: ["inert", "aria-hidden"],
  });
  stripBlockingAttributes(host);

  return () => {
    listening.abort();
    observer.disconnect();
  };
}
