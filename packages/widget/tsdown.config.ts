import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["./src/index.ts", "./src/internal.ts"],
    format: "esm",
    dts: true,
    clean: true,
    platform: "browser",
  },
  {
    // The script embed: one self-contained file served from the CDN as
    // `dist/widget.iife.js`. A dependency left out here becomes an undefined
    // global and the script throws on load.
    entry: { widget: "./src/script.ts" },
    format: "iife",
    dts: false,
    clean: false,
    minify: true,
    platform: "browser",
    deps: {
      alwaysBundle: [
        "@fasterfixes/core",
        "@floating-ui/dom",
        "modern-screenshot",
      ],
    },
    onSuccess(config) {
      const file = readFileSync(join(config.outDir, "widget.iife.js"));
      console.log(
        `[widget] widget.iife.js: ${file.byteLength} bytes minified, ${gzipSync(file).byteLength} bytes gzip`,
      );
    },
  },
]);
