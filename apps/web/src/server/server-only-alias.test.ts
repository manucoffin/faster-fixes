import { expect, it } from "vitest";

// The Next.js compiler resolves `server-only`; node does not. Without the
// alias in vitest.config.ts, every test that loads a guarded module of this
// folder fails on the import instead of running.
it("resolves `server-only` to an empty module", async () => {
  const serverOnly = await import("server-only");

  expect(Object.keys(serverOnly)).toEqual([]);
});
