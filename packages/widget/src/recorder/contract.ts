// What the Widget knows of the recorder file. Types only, so importing them
// never pulls the recorder into the script every visitor downloads.

/** A Recording in progress on the page, from mount to destroy. */
export type PageRecording = {
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
