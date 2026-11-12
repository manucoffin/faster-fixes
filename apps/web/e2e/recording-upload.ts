import { gunzipSync } from "node:zlib";

type UploadRequest = {
  headers: Record<string, string>;
  body: Buffer | null;
};

// The fields of an rrweb event every test reads; the rest is searched as JSON.
type RecordedEvent = { type: number; timestamp: number };

export type UploadedRecording = {
  events: RecordedEvent[];
  /** The events as JSON, to search for text that must or must not be there. */
  json: string;
  durationMs: number;
  formatVersion: string;
};

export const RECORDING_PATH = /^\/api\/v1\/feedback\/[^/]+\/recording$/;

// Each part of the multipart body, by field name, as raw bytes.
function readParts({ headers, body }: UploadRequest) {
  const boundary = /boundary=([^;]+)/.exec(headers["content-type"] ?? "")?.[1];
  if (!boundary || !body) throw new Error("Not a multipart upload");
  const parts = new Map<string, Buffer>();
  const delimiter = Buffer.from(`--${boundary}`, "latin1");
  let start = body.indexOf(delimiter);
  while (start !== -1) {
    const headersStart = start + delimiter.length + 2;
    const next = body.indexOf(delimiter, headersStart);
    if (next === -1) break;
    const headersEnd = body.indexOf("\r\n\r\n", headersStart, "latin1");
    const name = /name="([^"]+)"/.exec(
      body.subarray(headersStart, headersEnd).toString("latin1"),
    )?.[1];
    // The part's content runs to the CRLF before the next delimiter.
    if (name) parts.set(name, body.subarray(headersEnd + 4, next - 2));
    start = next;
  }
  return parts;
}

/** Decompresses the Recording file of an upload and reads its fields. */
export function readUploadedRecording(
  request: UploadRequest,
): UploadedRecording {
  const parts = readParts(request);
  const file = parts.get("recording");
  if (!file) throw new Error("No recording part in the upload");
  const json = gunzipSync(file).toString();
  return {
    events: JSON.parse(json) as RecordedEvent[],
    json,
    durationMs: Number(parts.get("durationMs")?.toString()),
    formatVersion: parts.get("formatVersion")?.toString() ?? "",
  };
}
