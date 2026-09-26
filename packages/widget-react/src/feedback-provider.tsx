import { useEffect, useRef, useState } from "react";
import { init } from "@fasterfixes/widget";
import type { Labels, WidgetPosition } from "@fasterfixes/widget";
import { isDevelopment } from "./environment.js";
import { WidgetSlotContext, createWidgetSlot } from "./widget-slot.js";

/**
 * @deprecated The Widget renders in a Shadow DOM, so class names cannot reach
 * it. Style it with the `--ff-*` CSS custom properties instead.
 */
export type ClassNames = {
  button?: string;
  popover?: string;
  textarea?: string;
  pin?: string;
  overlay?: string;
  successState?: string;
  errorState?: string;
  feedbackList?: string;
  feedbackListItem?: string;
};

type FeedbackProviderProps = {
  /** Public Project ID (`proj_...`) from your Faster Fixes project settings. */
  projectId?: string;
  /**
   * @deprecated Use `projectId` instead. Still accepted for backward
   * compatibility; will be removed in a future major version.
   */
  apiKey?: string;
  apiOrigin?: string;
  color?: string;
  position?: WidgetPosition;
  /**
   * @deprecated Ignored. The Widget renders in a Shadow DOM; style it with the
   * `--ff-*` CSS custom properties instead.
   */
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- the deprecated prop keeps its deprecated type
  classNames?: Partial<ClassNames>;
  labels?: Partial<Labels>;
  // Capture a Diagnostic Trail (console + network) with each feedback. Code-managed,
  // not a dashboard setting; set false to opt a site out of capture entirely.
  captureDiagnostics?: boolean;
  children: React.ReactNode;
};

const API_KEY_WARNING =
  "[faster-fixes] `apiKey` is deprecated. Pass your Project ID as `projectId` instead.";
const CLASS_NAMES_WARNING =
  "[faster-fixes] `classNames` is ignored: the Widget renders in a Shadow DOM. Style it with the `--ff-*` CSS custom properties instead.";

function isShallowEqual<T extends object>(a: T | undefined, b: T | undefined) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof T)[];
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.is(a[key], b[key]))
  );
}

// An inline `labels` object is a new reference on every render; only a change
// in its values should re-initialise the Widget.
function useShallowStable<T extends object>(value: T | undefined) {
  const [stable, setStable] = useState(value);
  if (!isShallowEqual(stable, value)) {
    setStable(value);
    return value;
  }
  return stable;
}

function useWarnOnce(shouldWarn: boolean, message: string) {
  // A ref, not module state, so Strict Mode's second effect run stays silent.
  const warned = useRef(false);
  useEffect(() => {
    if (!shouldWarn || warned.current || !isDevelopment()) return;
    warned.current = true;
    console.warn(message);
  }, [shouldWarn, message]);
}

export function FeedbackProvider({
  projectId,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- the provider still honours the deprecated prop it declares, for existing installs
  apiKey,
  apiOrigin,
  color,
  position,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- read only to warn that it is ignored
  classNames,
  labels,
  captureDiagnostics = true,
  children,
}: FeedbackProviderProps) {
  const [slot] = useState(createWidgetSlot);
  const stableLabels = useShallowStable(labels);

  // Prefer projectId; fall back to the deprecated apiKey. The server resolves
  // either a `proj_` Project ID or a legacy `ff_` key from the same header.
  const resolvedProjectId = projectId ?? apiKey ?? "";

  useWarnOnce(projectId === undefined && apiKey !== undefined, API_KEY_WARNING);
  useWarnOnce(classNames !== undefined, CLASS_NAMES_WARNING);

  // Runs only on the client, after hydration, so server markup is `children` alone.
  useEffect(() => {
    const widget = init({
      projectId: resolvedProjectId,
      apiOrigin,
      color,
      position,
      labels: stableLabels,
      captureDiagnostics,
    });
    slot.set(widget);
    return () => {
      // Released first: `destroy` drops every listener of the instance.
      slot.set(null);
      widget.destroy();
    };
  }, [
    slot,
    resolvedProjectId,
    apiOrigin,
    color,
    position,
    stableLabels,
    captureDiagnostics,
  ]);

  return (
    <WidgetSlotContext.Provider value={slot}>
      {children}
    </WidgetSlotContext.Provider>
  );
}
