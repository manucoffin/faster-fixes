import { z } from "zod";

import type { RecordingEvent } from "../_services/get-recording-events";
import {
  createRecordingTree,
  MASKED_ONLY,
  MutationSchema,
  SerializedNodeSchema,
} from "./recording-tree";
import {
  PAGE_SESSION_TAG,
  RECORDING_FORMAT_VERSIONS,
} from "./recording-format";

// Replay events in, steps out: what the Reviewer did before the Selection, as
// data. No storage, no HTTP, no markdown; every surface that shows a Recording
// as text reads its steps from here.

// Bump on any change to what the derivation returns: a cached result from an
// older version is derived again on its next read.
export const RECORDING_STEPS_VERSION = 2;

// Keeps the cached value small; the steps closest to the Selection are kept.
export const RECORDING_STEPS_MAX = 200;

export type RecordingStepType =
  | "load"
  | "click"
  | "input"
  | "select"
  | "submit"
  | "navigation"
  | "scroll"
  | "resize"
  | "selection";

export type RecordingStep = {
  type: RecordingStepType;
  /** Epoch milliseconds. */
  timestamp: number;
  /** Zero or negative, relative to the end of the Recording. */
  offsetMs: number;
  label: string | null;
  selector: string | null;
  detail: string | null;
};

// rrweb's EventType, IncrementalSource and MouseInteractions values.
const FULL_SNAPSHOT = 2;
const INCREMENTAL_SNAPSHOT = 3;
const CUSTOM = 5;
const MUTATION = 0;
const MOUSE_INTERACTION = 2;
const SCROLL = 3;
const VIEWPORT_RESIZE = 4;
const INPUT = 5;
const CLICK = 2;

const LOAD_WORDING = {
  load: "Page loaded",
  reload: "Page reloaded",
  back_forward: "Returned with back or forward",
} as const;

const FullSnapshotSchema = z.looseObject({
  data: z.looseObject({ node: SerializedNodeSchema }),
});
const IncrementalSchema = z.looseObject({
  data: z.looseObject({ source: z.number() }),
});
const MutationEventSchema = z.looseObject({ data: MutationSchema });
const MouseInteractionSchema = z.looseObject({
  data: z.looseObject({ type: z.number(), id: z.number() }),
});
const ScrollSchema = z.looseObject({
  data: z.looseObject({ id: z.number(), x: z.number(), y: z.number() }),
});
const ViewportResizeSchema = z.looseObject({
  data: z.looseObject({ width: z.number(), height: z.number() }),
});
const InputSchema = z.looseObject({
  data: z.looseObject({
    id: z.number(),
    text: z.string(),
    isChecked: z.boolean(),
  }),
});
const PageSessionSchema = z.looseObject({
  data: z.looseObject({
    tag: z.literal(PAGE_SESSION_TAG),
    payload: z.looseObject({
      navigationType: z.enum(["load", "reload", "back_forward"]),
      referrerPath: z.string().optional(),
    }),
  }),
});

/**
 * The steps of a Recording, ending with the Selection. `selection` names the
 * Feedback's selected element; the Recording itself stops before it.
 */
export function readRecordingSteps({
  formatVersion,
  events,
  selection,
}: {
  formatVersion: number;
  events: readonly RecordingEvent[];
  selection: { label: string | null; selector: string | null };
}):
  | {
      readable: true;
      startedAt: number;
      endedAt: number;
      steps: RecordingStep[];
    }
  | { readable: false; reason: "unknown-format-version" | "empty" } {
  if (!RECORDING_FORMAT_VERSIONS.has(formatVersion)) {
    return { readable: false, reason: "unknown-format-version" };
  }
  if (events.length === 0) return { readable: false, reason: "empty" };

  // A spread of every timestamp would overflow the stack on a long Recording.
  let startedAt = Infinity;
  let endedAt = -Infinity;
  for (const { timestamp } of events) {
    startedAt = Math.min(startedAt, timestamp);
    endedAt = Math.max(endedAt, timestamp);
  }
  const tree = createRecordingTree();
  // `nodeId` lets a run on one target (typing, scrolling) collapse into a step.
  const actions: (Omit<RecordingStep, "offsetMs"> & {
    nodeId: number | null;
  })[] = [];
  let hasOpening = false;

  // A run carries on in the last action when it has the same type and target:
  // it keeps its start and takes the latest detail.
  function add(
    type: RecordingStepType,
    timestamp: number,
    nodeId: number | null,
    detail: string | null,
    { run = false } = {},
  ) {
    const last = actions.at(-1);
    if (run && last?.type === type && last.nodeId === nodeId) {
      last.detail = detail;
      return;
    }
    const named =
      nodeId === null ? { label: null, selector: null } : tree.describe(nodeId);
    actions.push({ type, timestamp, ...named, detail, nodeId });
  }

  for (const event of events) {
    if (event.type === FULL_SNAPSHOT) {
      const snapshot = FullSnapshotSchema.safeParse(event);
      if (snapshot.success) tree.applyFullSnapshot(snapshot.data.data.node);
      continue;
    }
    if (event.type === CUSTOM) {
      const marker = PageSessionSchema.safeParse(event);
      if (!marker.success || hasOpening) continue;
      hasOpening = true;
      const { navigationType, referrerPath } = marker.data.data.payload;
      actions.push({
        type: "load",
        timestamp: event.timestamp,
        label: LOAD_WORDING[navigationType],
        selector: null,
        // A path only: anything carrying an origin is never shown.
        detail:
          navigationType === "load" && isSameOriginPath(referrerPath)
            ? referrerPath
            : null,
        nodeId: null,
      });
      continue;
    }
    if (event.type !== INCREMENTAL_SNAPSHOT) continue;
    const incremental = IncrementalSchema.safeParse(event);
    if (!incremental.success) continue;
    const { source } = incremental.data.data;
    const { timestamp } = event;

    if (source === MUTATION) {
      const mutation = MutationEventSchema.safeParse(event);
      if (mutation.success) tree.applyMutation(mutation.data.data);
    } else if (source === MOUSE_INTERACTION) {
      const interaction = MouseInteractionSchema.safeParse(event);
      if (interaction.success && interaction.data.data.type === CLICK) {
        add("click", timestamp, interaction.data.data.id, null);
      }
    } else if (source === INPUT) {
      const input = InputSchema.safeParse(event);
      if (!input.success) continue;
      const { id, text, isChecked } = input.data.data;
      const kind = tree.fieldKind(id);
      const value = text !== "" && !MASKED_ONLY.test(text) ? text : null;
      if (kind === "field") {
        add("input", timestamp, id, value, { run: true });
        continue;
      }
      // rrweb also writes the radios a choice unchecked; only the choice is a step.
      if (kind === "radio" && !isChecked) continue;
      // A click that made the choice says less than the choice: replace it.
      const last = actions.at(-1);
      if (last?.type === "click" && last.nodeId === id) actions.pop();
      add("select", timestamp, id, choiceDetail(kind, isChecked, value));
    } else if (source === SCROLL) {
      const scroll = ScrollSchema.safeParse(event);
      if (!scroll.success) continue;
      const { id, x, y } = scroll.data.data;
      add("scroll", timestamp, id, `to ${Math.round(x)},${Math.round(y)}`, {
        run: true,
      });
    } else if (source === VIEWPORT_RESIZE) {
      const resize = ViewportResizeSchema.safeParse(event);
      if (!resize.success) continue;
      const { width, height } = resize.data.data;
      add("resize", timestamp, null, `${width}x${height}`, { run: true });
    }
  }

  const steps = [
    ...actions.slice(-(RECORDING_STEPS_MAX - 1)),
    {
      type: "selection" as const,
      timestamp: endedAt,
      ...selection,
      detail: null,
    },
  ].map(({ type, timestamp, label, selector, detail }) => ({
    type,
    timestamp,
    offsetMs: timestamp - endedAt,
    label,
    selector,
    detail,
  }));
  return { readable: true, startedAt, endedAt, steps };
}

// The Widget records a same-origin path only; refuse anything else the file holds.
function isSameOriginPath(path: string | undefined): path is string {
  return path !== undefined && path.startsWith("/") && !path.startsWith("//");
}

function choiceDetail(
  kind: "select" | "checkbox" | "radio",
  isChecked: boolean,
  value: string | null,
): string | null {
  if (kind === "select") return value;
  return isChecked ? "checked" : "unchecked";
}
