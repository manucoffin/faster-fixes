import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["local-rules/**/*.test.js", "*.test.js"],
    environment: "node",
  },
});
