import {
  DIAGNOSTICS_MAX_ENTRIES,
  DIAGNOSTICS_MAX_MESSAGE_BYTES,
} from "../constants.js";
import type {
  ConsoleEntry,
  ConsoleLevel,
  DiagnosticTrail,
  NetworkEntry,
} from "../types.js";
import { redactUrl } from "./redact.js";

const CONSOLE_LEVELS: ConsoleLevel[] = [
  "log",
  "info",
  "warn",
  "error",
  "debug",
];

type ConsoleMethod = (...args: unknown[]) => void;

export type DiagnosticsRecorder = {
  start: () => void;
  stop: () => void;
  snapshot: () => DiagnosticTrail;
};

export type DiagnosticsRecorderOptions = {
  /**
   * Effective Faster Fixes API origin. Requests to this host are excluded so a
   * Trail reflects the host page's own traffic, not the widget's polling.
   */
  apiOrigin: string;
  maxEntries?: number;
  maxMessageBytes?: number;
};

/**
 * Framework-agnostic recorder that patches `console`, `fetch` and
 * `XMLHttpRequest` to keep a bounded, in-memory tail of console and network
 * activity. The React layer owns its lifecycle (start on mount, stop on
 * unmount). Recording failures are always swallowed — instrumentation must
 * never break the host page.
 */
export function createDiagnosticsRecorder(
  options: DiagnosticsRecorderOptions,
): DiagnosticsRecorder {
  const maxEntries = options.maxEntries ?? DIAGNOSTICS_MAX_ENTRIES;
  const maxMessageBytes =
    options.maxMessageBytes ?? DIAGNOSTICS_MAX_MESSAGE_BYTES;

  let apiHost: string | null = null;
  try {
    apiHost = new URL(options.apiOrigin).host;
  } catch {
    apiHost = null;
  }

  const consoleRing: ConsoleEntry[] = [];
  const networkRing: NetworkEntry[] = [];

  function pushConsole(entry: ConsoleEntry) {
    consoleRing.push(entry);
    if (consoleRing.length > maxEntries) consoleRing.shift();
  }

  function recordNetwork(
    method: string,
    url: string,
    status: number,
    startedAt: number,
  ) {
    try {
      networkRing.push({
        method,
        url: redactUrl(url),
        status,
        duration: Date.now() - startedAt,
        timestamp: startedAt,
      });
      if (networkRing.length > maxEntries) networkRing.shift();
    } catch {
      // Recording must never break the host page.
    }
  }

  function isApiRequest(rawUrl: string): boolean {
    if (!apiHost) return false;
    try {
      return new URL(rawUrl, window.location.href).host === apiHost;
    } catch {
      return false;
    }
  }

  // --- patch bookkeeping (kept so stop() can restore the originals) ---
  let started = false;
  const consoleTarget: Record<ConsoleLevel, ConsoleMethod> = console;
  const originalConsole = new Map<ConsoleLevel, ConsoleMethod>();
  let originalFetch: typeof window.fetch | null = null;
  let originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
  let originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
  const xhrMeta = new WeakMap<
    XMLHttpRequest,
    { method: string; url: string }
  >();

  function start() {
    if (started || typeof window === "undefined") return;
    started = true;

    for (const level of CONSOLE_LEVELS) {
      const original = consoleTarget[level];
      if (typeof original !== "function") continue;
      originalConsole.set(level, original);
      consoleTarget[level] = (...args: unknown[]) => {
        try {
          pushConsole({
            level,
            message: serializeArgs(args, maxMessageBytes),
            timestamp: Date.now(),
          });
        } catch {
          // Recording must never break the host page.
        }
        original.apply(console, args);
      };
    }

    if (typeof window.fetch === "function") {
      originalFetch = window.fetch;
      const fetchOriginal = originalFetch;
      window.fetch = function (
        ...args: Parameters<typeof window.fetch>
      ): Promise<Response> {
        const [input, init] = args;
        const startedAt = Date.now();
        const method = (
          init?.method ?? (input instanceof Request ? input.method : "GET")
        ).toUpperCase();
        const url = input instanceof Request ? input.url : String(input);
        const promise = fetchOriginal.apply(window, args);
        if (!isApiRequest(url)) {
          promise.then(
            (res) => recordNetwork(method, url, res.status, startedAt),
            () => recordNetwork(method, url, 0, startedAt),
          );
        }
        return promise;
      };
    }

    if (typeof XMLHttpRequest !== "undefined") {
      originalXhrOpen = XMLHttpRequest.prototype.open;
      originalXhrSend = XMLHttpRequest.prototype.send;
      const openOriginal = originalXhrOpen;
      const sendOriginal = originalXhrSend;

      XMLHttpRequest.prototype.open = function (
        this: XMLHttpRequest,
        method: string,
        url: string | URL,
        ...rest: unknown[]
      ): void {
        xhrMeta.set(this, {
          method: String(method).toUpperCase(),
          url: String(url),
        });
        return (openOriginal as (...a: unknown[]) => void).apply(this, [
          method,
          url,
          ...rest,
        ]);
      };

      XMLHttpRequest.prototype.send = function (
        this: XMLHttpRequest,
        ...args: Parameters<typeof XMLHttpRequest.prototype.send>
      ): void {
        const meta = xhrMeta.get(this);
        if (meta && !isApiRequest(meta.url)) {
          const startedAt = Date.now();
          this.addEventListener("loadend", () => {
            recordNetwork(meta.method, meta.url, this.status, startedAt);
          });
        }
        return sendOriginal.apply(this, args);
      };
    }
  }

  function stop() {
    if (!started) return;
    started = false;

    for (const [level, original] of originalConsole) {
      consoleTarget[level] = original;
    }
    originalConsole.clear();

    if (originalFetch) {
      window.fetch = originalFetch;
      originalFetch = null;
    }
    if (originalXhrOpen) {
      XMLHttpRequest.prototype.open = originalXhrOpen;
      originalXhrOpen = null;
    }
    if (originalXhrSend) {
      XMLHttpRequest.prototype.send = originalXhrSend;
      originalXhrSend = null;
    }
  }

  function snapshot(): DiagnosticTrail {
    return {
      console: consoleRing.slice(),
      network: networkRing.slice(),
    };
  }

  return { start, stop, snapshot };
}

function serializeArgs(args: unknown[], maxBytes: number): string {
  const message = args.map(serializeArg).join(" ");
  if (message.length <= maxBytes) return message;
  return `${message.slice(0, maxBytes)}… [truncated]`;
}

function serializeArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === "function") return "[Function]";
  if (typeof value !== "object")
    return String(value as number | boolean | bigint | symbol);

  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (_key, val: unknown) => {
      if (typeof val === "bigint") return val.toString();
      if (typeof val === "function") return "[Function]";
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
        if (typeof Node !== "undefined" && val instanceof Node) {
          return `[${val.nodeName}]`;
        }
      }
      return val;
    });
    return json ?? "[Unserializable]";
  } catch {
    return "[Unserializable]";
  }
}
