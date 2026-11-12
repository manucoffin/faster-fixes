import type { LoadRecorder } from "./contract.js";

/**
 * Loads the recorder for a framework Embed. The site's bundler splits the
 * dynamic `import()` into its own chunk, so only a Reviewer downloads it.
 */
export const importRecorder: LoadRecorder = () =>
  import("./index.js").catch(() => null);
