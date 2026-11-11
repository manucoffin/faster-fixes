// What the Widget knows of the recorder file. Types only, so importing them
// never pulls the recorder into the script every visitor downloads.

/** A Recording's file, ready to upload, with what travels beside it. */
export type RecordingFile = {
  /** The events as a gzip-compressed JSON array. */
  file: Blob;
  durationMs: number;
  formatVersion: number;
};

/** A Recording in progress on the page, from mount to destroy. */
export type PageRecording = {
  /**
   * Copies the buffer as of now and suspends recording until `resume`. The
   * copy compresses in the background; never rejects, and resolves to `null`
   * when there is nothing to send or it does not fit the cap.
   */
  take: () => Promise<RecordingFile | null>;
  /** Records again after `take`. Does nothing when not suspended. */
  resume: () => void;
  stop: () => void;
};

export type RecorderModule = {
  startRecording: () => PageRecording;
};

/**
 * Fetches the recorder file once per page session. Never rejects: a blocked or
 * failed file resolves to `null`, and the Widget keeps working without it.
 */
export type LoadRecorder = () => Promise<RecorderModule | null>;
