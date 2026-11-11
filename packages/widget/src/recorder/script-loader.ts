import type { LoadRecorder, RecorderModule } from "./contract.js";

/** The recorder file's name in `dist`, next to the script. */
export const RECORDER_FILE_NAME = "recorder.iife.js";

/** Where the recorder file puts its module once evaluated. */
export const RECORDER_GLOBAL = "FasterFixesRecorder";

/**
 * The recorder file on the CDN, at the exact version of the script that loads
 * it, so the two can never be out of step while the script follows the major.
 */
export function recorderFileUrl(version: string) {
  return `https://cdn.jsdelivr.net/npm/@fasterfixes/widget@${version}/dist/${RECORDER_FILE_NAME}`;
}

function readRecorder(document: Document): RecorderModule | null {
  const value = (document.defaultView as Record<string, unknown> | null)?.[
    RECORDER_GLOBAL
  ];
  return typeof value === "object" &&
    value !== null &&
    "startRecording" in value &&
    typeof value.startRecording === "function"
    ? (value as RecorderModule)
    : null;
}

/**
 * Loads the recorder file with a `<script>` element carrying the inserting
 * script's nonce, so a nonce-only policy lets it run. A dynamic `import()`
 * cannot carry one. The file is requested once per page session, even across
 * `init` calls, and a failure is never retried.
 */
export function createScriptRecorderLoader(
  document: Document,
  src: string,
  nonce: string,
): LoadRecorder {
  let pending: Promise<RecorderModule | null> | null = null;
  return () => {
    pending ??= new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      if (nonce) script.nonce = nonce;
      script.addEventListener("load", () => resolve(readRecorder(document)));
      script.addEventListener("error", () => resolve(null));
      document.head.appendChild(script);
    });
    return pending;
  };
}
