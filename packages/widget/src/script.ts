import { startWidget } from "./init.js";
import type { Widget } from "./instance.js";
import {
  createScriptRecorderLoader,
  recorderFileUrl,
} from "./recorder/script-loader.js";
import { findOwnScript, readScriptOptions } from "./script-options.js";

// Replaced at build time with the package version, see `tsdown.config.ts`.
declare const __WIDGET_VERSION__: string;

type FasterFixesGlobal = {
  init: (options: unknown) => Widget;
  instance?: Widget;
};

const host = window as Window & { FasterFixes?: FasterFixesGlobal };
const previous = host.FasterFixes;

// Read during evaluation: `currentScript` is null once the script has run.
const script = findOwnScript(document);
const loadRecorder = createScriptRecorderLoader(
  document,
  recorderFileUrl(__WIDGET_VERSION__),
  (script instanceof HTMLScriptElement ? script.nonce : undefined) ?? "",
);

const global: FasterFixesGlobal = {
  init(options) {
    // A second copy of the script has its own `init`, so tear down any
    // instance on the global, not only this copy's.
    global.instance?.destroy();
    previous?.instance?.destroy();
    // Untyped script code may pass anything; `init` validates it.
    global.instance = startWidget(
      options as Parameters<typeof startWidget>[0],
      loadRecorder,
    );
    return global.instance;
  },
};
host.FasterFixes = global;

const options = script ? readScriptOptions(script) : null;
if (options) global.init(options);
