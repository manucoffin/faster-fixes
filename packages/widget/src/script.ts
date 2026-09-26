import { init } from "./init.js";
import type { Widget } from "./instance.js";
import { findOwnScript, readScriptOptions } from "./script-options.js";

type FasterFixesGlobal = {
  init: (options: unknown) => Widget;
  instance?: Widget;
};

const host = window as Window & { FasterFixes?: FasterFixesGlobal };
const previous = host.FasterFixes;

const global: FasterFixesGlobal = {
  init(options) {
    // A second copy of the script has its own `init`, so tear down any
    // instance on the global, not only this copy's.
    global.instance?.destroy();
    previous?.instance?.destroy();
    // Untyped script code may pass anything; `init` validates it.
    global.instance = init(options as Parameters<typeof init>[0]);
    return global.instance;
  },
};
host.FasterFixes = global;

const script = findOwnScript(document);
const options = script ? readScriptOptions(script) : null;
if (options) global.init(options);
