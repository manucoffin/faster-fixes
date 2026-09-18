import { defineConfig } from "vitest/config";

// Pinned at module load so date assertions resolve identically on every machine and in CI.
process.env.TZ = "UTC";

export default defineConfig({
  // The app's tsconfig leaves JSX to Next.js (`jsx: "preserve"`), so Vite has
  // to be told how to compile it here: one service renders a React Email
  // template, and its test loads the `.tsx` module.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    passWithNoTests: true,
  },
});
