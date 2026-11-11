import { record } from "@rrweb/record";
import type { eventWithTime } from "@rrweb/types";

import type { PageRecording } from "./contract.js";
import { createRecordingBuffer } from "./recording-buffer.js";

// How often the buffer checks whether a new slice is due. Well under a slice,
// so a slice lasts 30 seconds give or take this.
const TICK_MS = 1_000;

// Bounds the recorder's cost on the page. Milliseconds between two recorded
// pointer positions, and between two recorded scroll positions of one element.
const MOUSEMOVE_SAMPLE_MS = 100;
const SCROLL_SAMPLE_MS = 150;

const idle: PageRecording = { stop() {} };

/**
 * Records the page into the buffer from now until `stop`. Silent on failure:
 * a recorder that cannot start leaves the page as it was.
 */
export function startRecording(): PageRecording {
  try {
    const buffer = createRecordingBuffer<eventWithTime, null>({
      takeFullSnapshot: () => record.takeFullSnapshot(),
      marker: null,
    });
    const stopRecord = record({
      emit: (event) => buffer.add(event),
      sampling: {
        mousemove: MOUSEMOVE_SAMPLE_MS,
        scroll: SCROLL_SAMPLE_MS,
        input: "last",
      },
      // Off so rrweb creates no worker and the page needs no `worker-src`.
      recordCanvas: false,
      // Images and fonts keep their address; nothing the page references is copied.
      inlineImages: false,
      collectFonts: false,
      // Returning true swallows the error, so the host's console stays clean.
      errorHandler: () => true,
    });
    if (!stopRecord) return idle;
    const timer = setInterval(() => buffer.tick(), TICK_MS);
    return {
      stop() {
        clearInterval(timer);
        stopRecord();
      },
    };
  } catch {
    return idle;
  }
}
