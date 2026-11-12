// The buffer behind a Recording: what the recorder file keeps in memory and
// copies at the Selection. Independent of rrweb and of the DOM, so it is
// driven by plain events and an injected clock. Lives with the recorder file
// only, never in the script every visitor downloads.

/** A slice starts with a full snapshot; the buffer keeps the last two. */
export const RECORDING_SLICE_MS = 30_000;
const KEPT_SLICES = 2;

/**
 * Mutated nodes allowed in one slice before it is dropped. A page past this
 * would cost the Reviewer's browser more than a Recording is worth, and its
 * slice would not fit the size cap anyway.
 */
export const RECORDING_MUTATION_THRESHOLD = 10_000;

/**
 * What a copy of the buffer holds. `marker` is the page session's start marker,
 * present only when the Recording starts at the start of its page session.
 */
export type Recording<E, M> = {
  events: E[];
  durationMs: number;
  marker: M | null;
};

type Slice<E> = {
  startedAt: number;
  events: E[];
  mutations: number;
  dropped: boolean;
  startsSession: boolean;
};

export type RecordingBufferOptions<E, M> = {
  /** Asks the caller's recorder to emit a full snapshot through `add`. */
  takeFullSnapshot: () => void;
  /** The page session's start marker, for the first slice. */
  marker: M;
  /** Mutated nodes an event carries. Defaults to none. */
  mutationsOf?: (event: E) => number;
  /** Wall-clock milliseconds, the Diagnostic Trail's clock. */
  now?: () => number;
  sliceMs?: number;
  mutationThreshold?: number;
};

export type RecordingBuffer<E, M> = {
  add: (event: E) => void;
  /**
   * Starts the next slice once the current one is `sliceMs` old. Driven by the
   * caller's timer, so a caller that stops ticking takes no periodic snapshot.
   */
  tick: () => void;
  /**
   * The Recording as of now, as candidates from largest to smallest: the whole
   * copy, then the most recent slice alone when the copy has two. Empty when
   * there is nothing to send. Independent of the buffer once taken.
   */
  copy: () => Recording<E, M>[];
  /** Empties the buffer and starts a new page session with a full snapshot. */
  reset: (marker: M) => void;
};

/**
 * The first slice opens at creation without a request: the caller's recorder
 * emits its own full snapshot when it starts.
 */
export function createRecordingBuffer<E, M>(
  options: RecordingBufferOptions<E, M>,
): RecordingBuffer<E, M> {
  const now = options.now ?? Date.now;
  const sliceMs = options.sliceMs ?? RECORDING_SLICE_MS;
  const mutationThreshold =
    options.mutationThreshold ?? RECORDING_MUTATION_THRESHOLD;
  const mutationsOf = options.mutationsOf ?? (() => 0);

  let marker = options.marker;
  let slices: Slice<E>[] = [openSlice(true)];

  function openSlice(startsSession: boolean): Slice<E> {
    return {
      startedAt: now(),
      events: [],
      mutations: 0,
      dropped: false,
      startsSession,
    };
  }

  // The new slice is in place before the request, so the snapshot the caller
  // emits synchronously through `add` lands in it.
  function startSlice(startsSession: boolean) {
    slices.push(openSlice(startsSession));
    if (slices.length > KEPT_SLICES) slices.shift();
    options.takeFullSnapshot();
  }

  function currentSlice() {
    // Never empty: created with one slice, and every change pushes one.
    return slices[slices.length - 1] as Slice<E>;
  }

  function toRecording(included: Slice<E>[], takenAt: number) {
    const first = included[0] as Slice<E>;
    return {
      events: included.flatMap((slice) => slice.events),
      durationMs: takenAt - first.startedAt,
      marker: first.startsSession ? marker : null,
    };
  }

  return {
    add(event) {
      const slice = currentSlice();
      if (slice.dropped) return;
      slice.mutations += mutationsOf(event);
      if (slice.mutations > mutationThreshold) {
        slice.dropped = true;
        slice.events = [];
        return;
      }
      slice.events.push(event);
    },

    tick() {
      if (now() - currentSlice().startedAt >= sliceMs) startSlice(false);
    },

    copy() {
      const takenAt = now();
      // A slice older than the window (no tick for a while) is left out, so a
      // Recording never lasts longer than two slices.
      const included = slices.filter(
        (slice) =>
          !slice.dropped &&
          slice.events.length > 0 &&
          takenAt - slice.startedAt <= sliceMs * KEPT_SLICES,
      );
      if (included.length === 0) return [];
      const whole = toRecording(included, takenAt);
      if (included.length === 1) return [whole];
      return [whole, toRecording(included.slice(-1), takenAt)];
    },

    reset(nextMarker) {
      marker = nextMarker;
      slices = [];
      startSlice(true);
    },
  };
}

/**
 * The largest candidate whose measured size fits the cap, with what the
 * measure produced (the compressed file), or null when none fits.
 */
export async function fitRecording<E, M, T extends { size: number }>(
  candidates: Recording<E, M>[],
  maxBytes: number,
  measure: (candidate: Recording<E, M>) => Promise<T>,
) {
  for (const recording of candidates) {
    const measured = await measure(recording);
    if (measured.size <= maxBytes) return { recording, measured };
  }
  return null;
}
