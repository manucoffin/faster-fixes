import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import { defineConfig } from "tsdown";

import packageJson from "./package.json" with { type: "json" };

// Footprint ceiling for the minified IIFE, checked on every build (CI builds
// the packages in each job, so going over fails the pull request). Set from
// the first green 1.0.0 build, 86,764 bytes, plus a margin of about 10% so
// ordinary fixes fit. Raise it deliberately, in its own commit, when a
// feature justifies the weight. Raised to 100,000 when the script gained the
// loader of the recorder file, at 95,256 bytes, with room for the rest of
// Recording (compression, upload and the comment form's line).
const IIFE_MAX_BYTES = 100_000;

// The same rule for the recorder file the script loads for Reviewers only. Set
// from its first measured build, 74,581 bytes, plus a margin of about 10%.
const RECORDER_MAX_BYTES = 82_000;

function checkCeiling(outDir: string, fileName: string, maxBytes: number) {
  const file = readFileSync(join(outDir, fileName));
  console.log(
    `[widget] ${fileName}: ${file.byteLength} bytes minified, ${gzipSync(file).byteLength} bytes gzip, ceiling ${maxBytes}`,
  );
  if (file.byteLength > maxBytes) {
    throw new Error(
      `[widget] ${fileName} is ${file.byteLength} bytes minified, above the ${maxBytes} byte ceiling in tsdown.config.ts.`,
    );
  }
}

export default defineConfig([
  {
    entry: ["./src/index.ts", "./src/internal.ts", "./src/testing.ts"],
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
    // The script loads the recorder file at this exact version from the CDN.
    define: { __WIDGET_VERSION__: JSON.stringify(packageJson.version) },
    deps: {
      alwaysBundle: [
        "@fasterfixes/core",
        "@floating-ui/dom",
        "modern-screenshot",
      ],
    },
    onSuccess(config) {
      checkCeiling(config.outDir, "widget.iife.js", IIFE_MAX_BYTES);
    },
  },
  {
    // The recorder file, `dist/recorder.iife.js`, which the script inserts for
    // a Reviewer only. A framework Embed reaches the same code through the ESM
    // build's dynamic `import()` instead.
    entry: { recorder: "./src/recorder/script.ts" },
    format: "iife",
    dts: false,
    clean: false,
    minify: true,
    platform: "browser",
    deps: { alwaysBundle: ["@rrweb/record"] },
    onSuccess(config) {
      checkCeiling(config.outDir, "recorder.iife.js", RECORDER_MAX_BYTES);
    },
  },
]);
