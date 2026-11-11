import { getStorageObject } from "@/server/storage/objects";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";
import { z } from "zod";

import { RECORDING_MAX_DECOMPRESSED_BYTES } from "@/app/_domains/feedback";

const gunzipAsync = promisify(gunzip);

// Only the fields every rrweb event carries; the rest is the derivation's to read.
const RecordingEventsSchema = z.array(
  z.looseObject({ type: z.number(), timestamp: z.number() }),
);

export type RecordingEvent = z.infer<typeof RecordingEventsSchema>[number];

export type RecordingUnreadableReason =
  | "missing"
  | "not-gzip"
  | "too-large"
  | "invalid-events";

type ReadStorageObject = (object: { key: string }) => Promise<Buffer | null>;

/**
 * The events of a stored Recording file. Never throws: every failure is an
 * `unreadable` result, so a damaged file never fails the Feedback it belongs to.
 */
export async function getRecordingEvents(
  recording: { key: string },
  readStorageObject: ReadStorageObject = getStorageObject,
): Promise<
  | { readable: true; events: RecordingEvent[] }
  | { readable: false; reason: RecordingUnreadableReason }
> {
  let file: Buffer | null;
  try {
    file = await readStorageObject(recording);
  } catch (error) {
    console.error(`Failed to read Recording (key=${recording.key}):`, error);
    return { readable: false, reason: "missing" };
  }
  if (!file) return { readable: false, reason: "missing" };

  let json: string;
  try {
    // zlib stops inflating as soon as the output passes the bound.
    const inflated = await gunzipAsync(file, {
      maxOutputLength: RECORDING_MAX_DECOMPRESSED_BYTES,
    });
    json = inflated.toString("utf8");
  } catch (error) {
    if (error instanceof RangeError) {
      return { readable: false, reason: "too-large" };
    }
    return { readable: false, reason: "not-gzip" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { readable: false, reason: "invalid-events" };
  }
  const events = RecordingEventsSchema.safeParse(parsed);
  if (!events.success) return { readable: false, reason: "invalid-events" };
  return { readable: true, events: events.data };
}
