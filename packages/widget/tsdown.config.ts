import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import { defineConfig } from "tsdown";

// Footprint ceiling for the minified IIFE, checked on every build (CI builds
// the packages in each job, so going over fails the pull request). Set from
// the first green 1.0.0 build, 86,764 bytes, plus a margin of about 10% so
// ordinary fixes fit. Raise it deliberately, in its own commit, when a
// feature justifies the weight.
const IIFE_MAX_BYTES = 95_000;

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
        `[widget] widget.iife.js: ${file.byteLength} bytes minified, ${gzipSync(file).byteLength} bytes gzip, ceiling ${IIFE_MAX_BYTES}`,
      );
      if (file.byteLength > IIFE_MAX_BYTES) {
        throw new Error(
          `[widget] widget.iife.js is ${file.byteLength} bytes minified, above the ${IIFE_MAX_BYTES} byte ceiling in tsdown.config.ts.`,
        );
      }
    },
  },
]);
