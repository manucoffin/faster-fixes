import { defineConfig } from "vite";

// Bundles the player document's script with the replayer (ADR-0023). The output
// is untracked, so no copy of the vendor build is ever committed.
export default defineConfig({
  publicDir: false,
  resolve: { tsconfigPaths: true },
  build: {
    outDir: "public/recording-player",
    emptyOutDir: true,
    lib: {
      entry: "src/app/recording-player/_features/play-recording.ts",
      formats: ["iife"],
      name: "FasterFixesRecordingPlayer",
      fileName: () => "player.js",
      cssFileName: "player",
    },
  },
});
