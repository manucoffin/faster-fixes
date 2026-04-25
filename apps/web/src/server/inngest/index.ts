import { Inngest } from "inngest";

// v4 defaults to cloud mode, which requires a signing key. Use the local
// dev server during development so we don't need credentials there.
// Checkpointing is on by default in v4; cap it below the route's maxDuration
// so steps checkpoint gracefully before Vercel kills the request.
export const inngest = new Inngest({
  id: "faster-fixes",
  isDev: process.env.NODE_ENV !== "production",
  checkpointing: { maxRuntime: "50s" },
});
