declare const process: { env: { NODE_ENV?: string } };

// Bundlers replace `process.env.NODE_ENV` at build time. Loaded unbundled in a
// browser, `process` does not exist and the Widget behaves as a production build.
export function isDevelopment() {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}
