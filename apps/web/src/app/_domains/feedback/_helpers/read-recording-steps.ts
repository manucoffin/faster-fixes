import { z } from "zod";

import type { RecordingEvent } from "../_services/get-recording-events";
import {
  createRecordingTree,
  MutationSchema,
  SerializedNodeSchema,
} from "./recording-tree";

// Replay events in, steps out: what the Reviewer did before the Selection, as
// data. No storage, no HTTP, no markdown; every surface that shows a Recording
// as text reads its steps from here.

/** The replay format versions this derivation reads. */
const KNOWN_FORMAT_VERSIONS = new Set([1]);

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
const MUTATION = 0;
const MOUSE_INTERACTION = 2;
const CLICK = 2;

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
  if (!KNOWN_FORMAT_VERSIONS.has(formatVersion)) {
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
  const actions: Omit<RecordingStep, "offsetMs">[] = [];

  for (const event of events) {
    if (event.type === FULL_SNAPSHOT) {
      const snapshot = FullSnapshotSchema.safeParse(event);
      if (snapshot.success) tree.applyFullSnapshot(snapshot.data.data.node);
      continue;
    }
    if (event.type !== INCREMENTAL_SNAPSHOT) continue;
    const incremental = IncrementalSchema.safeParse(event);
    if (!incremental.success) continue;
    const { source } = incremental.data.data;

    if (source === MUTATION) {
      const mutation = MutationEventSchema.safeParse(event);
      if (mutation.success) tree.applyMutation(mutation.data.data);
    } else if (source === MOUSE_INTERACTION) {
      const interaction = MouseInteractionSchema.safeParse(event);
      if (!interaction.success || interaction.data.data.type !== CLICK) {
        continue;
      }
      actions.push({
        type: "click",
        timestamp: event.timestamp,
        ...tree.describe(interaction.data.data.id),
        detail: null,
      });
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
