// What the dashboard knows of the file format the Widget writes, shared by the
// server-side reader, the derivation of steps and the browser-side reader.

/** The replay format versions the dashboard reads. */
export const RECORDING_FORMAT_VERSIONS: ReadonlySet<number> = new Set([1]);

// The upload is capped at 4 MB of gzip; DOM snapshots rarely compress past
// 15:1, so this bound only stops a file built to inflate.
export const RECORDING_MAX_DECOMPRESSED_BYTES = 64 * 1024 * 1024;

/** The tag of the custom event the Widget writes when a Recording starts with its page. */
export const PAGE_SESSION_TAG = "fasterfixes/page-session";
