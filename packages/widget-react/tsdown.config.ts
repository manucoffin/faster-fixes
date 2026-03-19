import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  platform: "browser",
  deps: {
    neverBundle: ["react", "react-dom"],
  },
});
