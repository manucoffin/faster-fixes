// PROTOTYPE, throwaway (issue 491): never merge into dev or main.
// Question: what does recording a narrated Recording look and feel like for a
// Reviewer in the Widget, from the entry point to the submitted Feedback?
// Three variants of the whole flow, switchable via `?variant=A..C`, the arrow
// keys and a floating bar, on `/prototype/narrated-widget` only. Nothing is
// recorded: the microphone, its browser prompt, the clock, the resume after a
// page load and the upload are simulated. The bar picks the scenario.

import type { WidgetPosition } from "@fasterfixes/core";

const PROTOTYPE_PATH = "/prototype/narrated-widget";
const SETTINGS_KEY = "ff-proto-narrated-settings";
const SESSION_KEY = "ff-proto-narrated-session";
const WARNING_MS = 15_000;
const UPLOAD_MS = 3200;
const TICK_MS = 200;

const VARIANTS = [
  { key: "A", name: "Toolbar control, the pill records" },
  { key: "B", name: "Choice at the button, dock and review" },
  { key: "C", name: "Own button, one click, no review step" },
] as const;

const SCENARIOS = {
  plan: [
    ["1", "Free, 1 min"],
    ["3", "Pro, 3 min"],
    ["5", "Agency, 5 min"],
  ],
  speed: [
    ["1", "Clock 1x"],
    ["10", "Clock 10x"],
  ],
  mic: [
    ["granted", "Mic: already allowed"],
    ["asks", "Mic: browser asks"],
    ["refused", "Mic: refused earlier"],
    ["blocked", "Mic: blocked by the site"],
    ["unsupported", "Unsupported browser"],
    ["count", "Plan count reached"],
  ],
  load: [
    ["resumes", "Page load: resumes"],
    ["asks", "Page load: Firefox asks again"],
    ["fails", "Page load: cannot resume"],
  ],
  upload: [
    ["ok", "Upload: succeeds"],
    ["fails", "Upload: fails"],
  ],
} as const;

type VariantKey = (typeof VARIANTS)[number]["key"];
type ScenarioName = keyof typeof SCENARIOS;
type Settings = { variant: VariantKey } & Record<ScenarioName, string>;

type Phase =
  | "idle"
  | "menu"
  | "intro"
  | "prompt"
  | "countdown"
  | "recording"
  | "paused"
  | "reprompt"
  | "review"
  | "sending"
  | "sendError"
  | "sent"
  | "refused"
  | "blocked";

type Session = {
  phase: Phase;
  elapsedMs: number;
  loads: number;
  stopReason: "limit" | "load" | null;
  note: string;
  /** Found at Widget load, from an earlier page: never sent, never discarded. */
  leftover: boolean;
};

type Hooks = {
  document: Document;
  shadow: ShadowRoot;
  stack: HTMLElement;
  toolbar: HTMLElement;
  position: WidgetPosition;
  startAnnotation: () => void;
  exitFeedbackMode: () => void;
  /** Creates the Feedback, with no Selection, and shows it in the list. */
  addFeedback: (comment: string) => Promise<void>;
};

type NarratedPrototype = { destroy: () => void };

const ICONS = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  pause:
    '<line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  close:
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  message:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
};

const CSS = `
  .proto-bar {
    position: fixed;
    left: 12px;
    top: 120px;
    z-index: var(--ff-z-index);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    max-width: 230px;
    padding: 8px 10px;
    border: 2px dashed #facc15;
    border-radius: 12px;
    background: #000;
    color: #fff;
    font: 12px/1.3 ui-monospace, monospace;
    pointer-events: auto;
  }
  .proto-bar button, .proto-bar select {
    all: initial;
    padding: 3px 8px;
    border-radius: 6px;
    background: #27272a;
    color: #fff;
    font: inherit;
    cursor: pointer;
  }
  .proto-bar .proto-state { flex-basis: 100%; color: #facc15; }
  .proto-bar .proto-name { font-weight: 700; }

  /* The simulated browser permission prompt: prototype chrome, not design. */
  .proto-browser {
    position: fixed;
    top: 12px;
    left: 96px;
    z-index: var(--ff-z-index);
    width: 300px;
    padding: 14px;
    border: 2px dashed #facc15;
    border-radius: 12px;
    background: #fff;
    color: #111;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    font: 13px/1.4 system-ui, sans-serif;
    pointer-events: auto;
  }
  .proto-browser small { display: block; margin-bottom: 4px; color: #a16207; font: 11px ui-monospace, monospace; }
  .proto-browser div { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  .proto-browser button {
    all: initial;
    padding: 5px 12px;
    border-radius: 6px;
    background: #e5e7eb;
    color: #111;
    font: 500 13px system-ui, sans-serif;
    cursor: pointer;
  }
  .proto-browser button:last-child { background: #2563eb; color: #fff; }

  .proto-icon {
    all: initial;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--ff-foreground);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .proto-icon:hover { background: rgba(255, 255, 255, 0.12); }
  .proto-icon:focus-visible, .proto-row:focus-visible, .proto-fab:focus-visible, .proto-link:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }
  .proto-icon svg, .proto-row svg, .proto-fab svg { display: block; }

  .proto-dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    animation: ff-proto-pulse 1.6s ease-in-out infinite;
  }
  [data-live="false"] .proto-dot { background: #a1a1aa; animation: none; }
  .proto-time { font-variant-numeric: tabular-nums; font-weight: 600; }
  .proto-muted { color: #a1a1aa; }
  [data-warning="true"] .proto-left { color: #fbbf24; }

  .proto-title { margin: 0 0 6px; font-weight: 600; }
  .proto-text { margin: 0 0 10px; color: #a1a1aa; font-size: 13px; }
  .proto-text strong { color: var(--ff-foreground); font-weight: 500; }
  .proto-link {
    all: initial;
    color: #a1a1aa;
    font: 500 13px/1.4 var(--ff-font-family);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .proto-link:hover { color: var(--ff-foreground); }
  .proto-spread { justify-content: space-between; align-items: center; }
  .proto-progress {
    height: 4px;
    margin: 4px 0 10px;
    overflow: hidden;
    border-radius: 2px;
    background: #3f3f46;
  }
  .proto-progress i { display: block; height: 100%; background: var(--ff-accent); transition: width 0.1s linear; }
  .proto-panel .textarea { min-height: 56px; }

  /* The panel: one element, placed by each variant. */
  .proto-panel {
    padding: 14px;
    border-radius: var(--ff-radius);
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font: 14px/1.4 var(--ff-font-family);
    pointer-events: auto;
    animation: ff-proto-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .proto-panel[data-variant="A"] { width: 300px; }
  .proto-panel[data-variant="B"] {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: var(--ff-z-index);
    width: 400px;
    max-width: calc(100vw - 32px);
    padding: 20px;
    transform: translate(-50%, -50%);
    animation: none;
  }
  .proto-panel[data-variant="C"] { width: 280px; padding: 12px; font-size: 13px; }
  .proto-backdrop {
    position: fixed;
    inset: 0;
    z-index: calc(var(--ff-z-index) - 1);
    background: rgba(0, 0, 0, 0.45);
    pointer-events: auto;
  }

  /* A: a fourth control in the toolbar, then the pill itself is the recorder. */
  .toolbar[data-proto-entry="A"][data-state="expanded"] { height: 148px; }
  .proto-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 40px;
    padding: 10px 0 6px;
    border-radius: 20px;
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    font: 11px/1 var(--ff-font-family);
    pointer-events: auto;
  }
  .proto-pill .proto-time { margin: 4px 0 2px; }
  .proto-pill-note {
    align-self: flex-end;
    padding: 6px 8px;
    border-radius: calc(var(--ff-radius) - 2px);
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
    font: 500 12px/1.3 var(--ff-font-family);
    white-space: nowrap;
  }

  /* B: the button opens a choice; recording lives in a dock at the bottom. */
  .proto-menu {
    display: flex;
    flex-direction: column;
    width: 260px;
    padding: 4px;
    border-radius: var(--ff-radius);
    background: var(--ff-background);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
    animation: ff-proto-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .proto-row {
    all: initial;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: calc(var(--ff-radius) - 2px);
    color: var(--ff-foreground);
    font: 500 13px/1.3 var(--ff-font-family);
    cursor: pointer;
  }
  .proto-row:hover { background: rgba(255, 255, 255, 0.07); }
  .proto-row span { display: flex; flex-direction: column; }
  .proto-row small { color: #a1a1aa; font-weight: 400; font-size: 12px; }
  .proto-dock {
    position: fixed;
    bottom: 20px;
    left: 50%;
    z-index: var(--ff-z-index);
    display: flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 8px 0 14px;
    border-radius: 22px;
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    font: 13px/1 var(--ff-font-family);
    transform: translateX(-50%);
    pointer-events: auto;
    white-space: nowrap;
  }
  .proto-meter { display: flex; align-items: center; gap: 2px; height: 16px; }
  .proto-meter i { width: 2px; height: 3px; border-radius: 1px; background: #a1a1aa; transition: height 0.15s ease; }
  .proto-track { width: 72px; height: 3px; overflow: hidden; border-radius: 2px; background: #3f3f46; }
  .proto-track i { display: block; height: 100%; background: var(--ff-foreground); }
  [data-warning="true"] .proto-track i { background: #fbbf24; }
  .proto-stop {
    all: initial;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px 0 8px;
    border-radius: 15px;
    background: #ef4444;
    color: #fff;
    font: 600 13px/1 var(--ff-font-family);
    cursor: pointer;
  }
  .proto-count {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: var(--ff-z-index);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    font: 600 56px/1 var(--ff-font-family);
    transform: translate(-50%, -50%);
  }
  .proto-replay {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    margin: 0 0 12px;
    overflow: hidden;
    border-radius: calc(var(--ff-radius) - 2px);
    background: #27272a;
    color: #a1a1aa;
    font-size: 12px;
  }
  .proto-replay .proto-icon { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.14); }
  .proto-replay b { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--ff-accent); }

  /* C: its own button, a frame around the page, a chip, a toast. */
  .proto-fab {
    all: initial;
    position: absolute;
    left: 4px;
    bottom: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }
  .toolbar[data-state="expanded"] .proto-fab { display: none; }
  .proto-fab .tooltip { max-width: 220px; }
  .proto-fab:hover .tooltip, .proto-fab:focus-visible .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translate(0, -50%) scale(1);
    transition-delay: 150ms;
  }
  .proto-frame {
    position: fixed;
    inset: 0;
    z-index: calc(var(--ff-z-index) - 1);
    border: 3px solid #ef4444;
    pointer-events: none;
  }
  .proto-frame[data-live="false"] { border-color: #a1a1aa; border-style: dashed; }
  .proto-chip {
    position: fixed;
    top: 12px;
    left: 50%;
    z-index: var(--ff-z-index);
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 4px 0 12px;
    border-radius: 16px;
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    font: 12px/1 var(--ff-font-family);
    transform: translateX(-50%);
    pointer-events: auto;
    white-space: nowrap;
  }
  .proto-chip .proto-stop { height: 24px; padding: 0 10px 0 6px; font-size: 12px; }

  @keyframes ff-proto-pulse { 50% { opacity: 0.35; } }
  @keyframes ff-proto-in { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: reduce) {
    .proto-dot, .proto-panel, .proto-menu { animation: none; }
  }
`;

function readJson<T>(key: string): Partial<T> {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "{}") as Partial<T>;
  } catch {
    return {};
  }
}

function clock(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function spoken(ms: number) {
  const seconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds} s`;
  return seconds % 60 === 0
    ? `${minutes} min`
    : `${minutes} min ${seconds % 60} s`;
}

export function mountNarratedPrototype(hooks: Hooks): NarratedPrototype {
  if (!window.location.pathname.startsWith(PROTOTYPE_PATH)) {
    return { destroy() {} };
  }
  const { document, shadow, stack, toolbar } = hooks;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);
  shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];

  const urlVariant = new URLSearchParams(window.location.search).get("variant");
  const settings: Settings = {
    variant: "A",
    plan: "3",
    speed: "1",
    mic: "granted",
    load: "resumes",
    upload: "ok",
    ...readJson<Settings>(SETTINGS_KEY),
    ...(VARIANTS.some(({ key }) => key === urlVariant) && {
      variant: urlVariant as VariantKey,
    }),
  };

  const fresh = (): Session => ({
    phase: "idle",
    elapsedMs: 0,
    loads: 0,
    stopReason: null,
    note: "",
    leftover: false,
  });
  let session: Session = { ...fresh(), ...readJson<Session>(SESSION_KEY) };
  let progress = 0;
  let countdown = 3;
  let confirmingDiscard = false;
  let replaying = false;
  let flash: string | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const maxMs = () => Number(settings.plan) * 60_000;
  const available = () =>
    settings.mic !== "unsupported" && settings.mic !== "count";
  const isCapturing = () =>
    ["recording", "paused", "reprompt"].includes(session.phase);

  function later(ms: number, run: () => void) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      run();
    }, ms);
    timers.add(timer);
  }

  function save() {
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function go(phase: Phase, patch: Partial<Session> = {}) {
    session = { ...session, ...patch, phase };
    confirmingDiscard = false;
    replaying = false;
    render();
  }

  // ---- helpers ------------------------------------------------------------

  function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = "",
    text = "",
  ) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(name: keyof typeof ICONS, size = 16) {
    const holder = el("span");
    holder.style.display = "flex";
    holder.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
    return holder;
  }

  function iconButton(
    name: keyof typeof ICONS,
    label: string,
    onClick: () => void,
    className = "proto-icon",
  ) {
    const button = el("button", className);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.append(icon(name));
    button.addEventListener("click", onClick);
    return button;
  }

  function action(
    text: string,
    variant: "primary" | "secondary",
    onClick: () => void,
  ) {
    const button = el("button", `action action-${variant}`, text);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
  }

  function link(text: string, onClick: () => void) {
    const button = el("button", "proto-link", text);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
  }

  function actions(...children: HTMLElement[]) {
    const row = el("div", "actions");
    row.append(...children);
    return row;
  }

  // ---- flow ---------------------------------------------------------------

  function begin() {
    hooks.exitFeedbackMode();
    session = fresh();
    // C starts on the click: its one line of consent is the button's label.
    if (settings.variant === "C") requestMicrophone();
    else go("intro");
  }

  function requestMicrophone() {
    if (settings.mic === "blocked") go("blocked");
    else if (settings.mic === "refused") go("refused");
    else if (settings.mic === "asks") go("prompt");
    else startCapture();
  }

  function startCapture() {
    if (settings.variant !== "B") {
      go("recording");
      return;
    }
    countdown = 3;
    go("countdown");
    const step = () => {
      if (session.phase !== "countdown") return;
      countdown -= 1;
      if (countdown === 0) go("recording");
      else {
        render();
        later(800, step);
      }
    };
    later(800, step);
  }

  function stop(reason: Session["stopReason"] = null) {
    go("review", { stopReason: reason });
  }

  function discard() {
    session = fresh();
    render();
  }

  // Asked twice everywhere: a discard erases the voice for good.
  function discardControl(text = "Discard") {
    return confirmingDiscard
      ? link("Discard for good?", discard)
      : link(text, () => {
          confirmingDiscard = true;
          render();
          later(3000, () => {
            if (!confirmingDiscard) return;
            confirmingDiscard = false;
            render();
          });
        });
  }

  function send() {
    progress = 0;
    go("sending");
    const startedAt = Date.now();
    const step = () => {
      if (session.phase !== "sending") return;
      progress = Math.min(1, (Date.now() - startedAt) / UPLOAD_MS);
      if (settings.upload === "fails" && progress > 0.6) {
        go("sendError");
        return;
      }
      if (progress < 1) {
        updateLive();
        later(100, step);
        return;
      }
      const comment =
        session.note.trim() || `Recording, ${spoken(session.elapsedMs)}`;
      void hooks.addFeedback(comment);
      go("sent");
      later(1800, () => {
        if (session.phase === "sent") discard();
      });
    };
    step();
  }

  // What a full page load finds: the capture was persisted as it was produced.
  function resumeAfterLoad() {
    if (isCapturing() || session.phase === "countdown") {
      session.loads += 1;
      if (settings.load === "fails") {
        session = { ...session, phase: "review", stopReason: "load" };
      } else if (settings.load === "asks") {
        session.phase = "reprompt";
      } else {
        if (session.phase !== "paused") session.phase = "recording";
        flash = "Recording resumed.";
        later(2500, () => {
          flash = null;
          render();
        });
      }
    } else if (["review", "sending", "sendError"].includes(session.phase)) {
      session = { ...session, phase: "review", leftover: true };
    } else {
      session = fresh();
    }
  }

  // ---- surfaces -----------------------------------------------------------

  const bar = el("div", "proto-bar");
  const barState = el("span", "proto-state");
  const panel = el("div", "proto-panel");
  panel.setAttribute("part", "popover");
  const backdrop = el("div", "proto-backdrop");
  const browser = el("div", "proto-browser");
  const indicator = el("div");
  const frame = el("div", "proto-frame");
  const pillNote = el("div", "proto-pill-note");
  const menu = el("div", "proto-menu");
  const counter = el("div", "proto-count");
  let liveNodes: {
    time?: HTMLElement;
    left?: HTMLElement;
    track?: HTMLElement;
    meter?: HTMLElement[];
    bar?: HTMLElement;
    percent?: HTMLElement;
  } = {};

  function buildBar() {
    const previous = el("button", "", "←");
    const next = el("button", "", "→");
    previous.addEventListener("click", () => cycle(-1));
    next.addEventListener("click", () => cycle(1));
    const name = el("span", "proto-name");
    name.dataset.role = "name";
    bar.append(previous, name, next);
    for (const scenario of Object.keys(SCENARIOS) as ScenarioName[]) {
      const select = el("select");
      for (const [value, label] of SCENARIOS[scenario]) {
        const option = el("option", "", label);
        option.value = value;
        select.append(option);
      }
      select.value = settings[scenario];
      select.addEventListener("change", () => {
        settings[scenario] = select.value;
        render();
      });
      bar.append(select);
    }
    const load = el("button", "", "Full page load");
    load.addEventListener("click", () => {
      save();
      window.location.reload();
    });
    const reset = el("button", "", "Reset");
    reset.addEventListener("click", discard);
    bar.append(load, reset, barState);
    shadow.append(bar);
  }

  function cycle(step: number) {
    const index = VARIANTS.findIndex(({ key }) => key === settings.variant);
    const next = VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length];
    if (!next) return;
    settings.variant = next.key;
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next.key);
    window.history.replaceState(null, "", url);
    session = fresh();
    render();
  }

  function onKey(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const focused = shadow.activeElement ?? document.activeElement;
    if (focused?.matches("input, textarea, select, [contenteditable]")) return;
    cycle(event.key === "ArrowLeft" ? -1 : 1);
  }
  window.addEventListener("keydown", onKey);

  // ---- entry points -------------------------------------------------------

  const entryA = el("button", "control");
  entryA.type = "button";
  entryA.setAttribute("aria-label", "Record with your voice");
  entryA.title = "Record with your voice";
  entryA.append(icon("mic"));
  entryA.addEventListener("click", begin);

  const fab = el("button", "proto-fab");
  fab.type = "button";
  fab.setAttribute("aria-label", "Record with your voice");
  const fabTip = el("span", "tooltip");
  fabTip.dataset.side = hooks.position.includes("right") ? "left" : "right";
  fab.append(icon("mic"), fabTip);
  fab.addEventListener("click", (event) => {
    event.stopPropagation();
    begin();
  });

  // B: the floating button asks which kind of Feedback before anything starts.
  const trigger = toolbar.querySelector<HTMLElement>(".button");
  function onTrigger(event: Event) {
    if (settings.variant !== "B" || !available()) return;
    event.stopImmediatePropagation();
    go(session.phase === "menu" ? "idle" : "menu");
  }
  trigger?.addEventListener("click", onTrigger, true);

  function menuRow(
    iconName: keyof typeof ICONS,
    title: string,
    detail: string,
    onClick: () => void,
  ) {
    const row = el("button", "proto-row");
    row.type = "button";
    const text = el("span");
    text.append(title, el("small", "", detail));
    row.append(icon(iconName, 18), text);
    row.addEventListener("click", onClick);
    return row;
  }

  function renderEntries() {
    const { variant } = settings;
    const offered = available() && session.phase === "idle";
    toolbar.dataset.protoEntry = variant === "A" && available() ? "A" : "";
    if (variant === "A" && available()) {
      toolbar.querySelector(".controls")?.prepend(entryA);
    } else entryA.remove();
    if (variant === "C" && offered) {
      fabTip.textContent = `Record with your voice, up to ${settings.plan} min. The page and your voice are sent to the team.`;
      toolbar.append(fab);
    } else fab.remove();

    menu.replaceChildren();
    if (variant === "B" && session.phase === "menu") {
      menu.append(
        menuRow("message", "Comment on an element", "Click or drag.", () => {
          go("idle");
          hooks.startAnnotation();
        }),
        menuRow(
          "mic",
          "Record with your voice",
          `Show the problem, up to ${settings.plan} min.`,
          begin,
        ),
      );
      stack.append(menu);
    } else menu.remove();
  }

  // ---- panel --------------------------------------------------------------

  const CONSENT =
    "The page as displayed and your voice are recorded and sent to the team. What you type in fields is never captured.";

  function heading(text: string) {
    return el("p", "proto-title", text);
  }

  function body(text: string) {
    return el("p", "proto-text", text);
  }

  function commentInstead() {
    return action("Comment on an element", "primary", () => {
      discard();
      hooks.startAnnotation();
    });
  }

  function noteField() {
    const textarea = el("textarea", "textarea");
    textarea.placeholder = "Add a note (optional)";
    textarea.setAttribute("aria-label", "Add a note (optional)");
    textarea.value = session.note;
    textarea.addEventListener("input", () => {
      session.note = textarea.value;
    });
    return textarea;
  }

  function replayBlock() {
    const block = el("div", "proto-replay");
    if (!replaying) {
      block.append(
        iconButton("play", "Play the recording", () => {
          replaying = true;
          render();
          later(4000, () => {
            if (!replaying) return;
            replaying = false;
            render();
          });
        }),
      );
      return block;
    }
    const scrub = el("b");
    scrub.animate([{ width: "0%" }, { width: "100%" }], {
      duration: 4000,
      fill: "forwards",
    });
    block.append("Replaying the page with your voice (simulated).", scrub);
    return block;
  }

  function progressBar() {
    const track = el("div", "proto-progress");
    const fill = el("i");
    track.append(fill);
    liveNodes.bar = fill;
    return track;
  }

  function reviewContent(): HTMLElement[] {
    const { variant } = settings;
    const duration = spoken(session.elapsedMs);
    let reason = "";
    if (session.stopReason === "limit") {
      reason = `It stopped at the ${settings.plan} minute limit.`;
    } else if (session.stopReason === "load") {
      reason = "It stopped when the page changed and could not continue.";
    }
    let title = "Recording ready";
    if (session.leftover) title = "A recording was not sent";
    else if (session.stopReason === "load") title = "Recording stopped";
    const sendButton = action(
      session.stopReason === "load" ? "Send what was captured" : "Send",
      "primary",
      send,
    );
    const again = link("Record again", begin);
    if (variant === "C") {
      // No review step: one line, a note, send.
      const compact = actions(discardControl(), sendButton);
      compact.classList.add("proto-spread");
      return [
        heading(`${title}, ${duration}.`),
        ...(reason ? [body(reason)] : []),
        noteField(),
        compact,
      ];
    }
    const row = actions(discardControl(), sendButton);
    row.classList.add("proto-spread");
    return [
      heading(title),
      body(`${duration} of the page and your voice. ${reason}`.trim()),
      ...(variant === "B" ? [replayBlock()] : []),
      noteField(),
      row,
      ...(session.leftover ? [] : [again]),
    ];
  }

  function panelContent(): HTMLElement[] | null {
    const { variant } = settings;
    switch (session.phase) {
      case "intro":
        return [
          heading("Record with your voice"),
          body(CONSENT),
          body(
            `Up to ${settings.plan} ${settings.plan === "1" ? "minute" : "minutes"}. You can discard it before sending.`,
          ),
          actions(
            action("Cancel", "secondary", discard),
            action("Start recording", "primary", requestMicrophone),
          ),
        ];
      case "prompt":
        return variant === "C"
          ? null
          : [
              heading("Allow the microphone"),
              body("Your browser is asking. A recording needs your voice."),
              actions(action("Cancel", "secondary", discard)),
            ];
      case "refused":
        return [
          heading("The microphone is off"),
          body(
            "A recording needs your voice. Allow the microphone for this site in your browser, or leave a written comment.",
          ),
          actions(action("Close", "secondary", discard), commentInstead()),
          link("Try again", () =>
            settings.mic === "refused" ? go("refused") : requestMicrophone(),
          ),
        ];
      case "blocked":
        return [
          heading("Recording is unavailable here"),
          body(
            "This site does not allow the microphone. You can leave a written comment.",
          ),
          actions(action("Close", "secondary", discard), commentInstead()),
        ];
      case "review":
        return reviewContent();
      case "sending": {
        const label = el("p", "proto-title", "Sending recording");
        const percent = el("span", "proto-muted proto-time");
        liveNodes.percent = percent;
        label.append(" ", percent);
        return [
          label,
          progressBar(),
          ...(variant === "B"
            ? [body("Keep this page open until it is sent.")]
            : []),
        ];
      }
      case "sendError":
        return [
          heading("The recording could not be sent"),
          body("It is kept on this device for 24 hours."),
          actions(discardControl(), action("Try again", "primary", send)),
        ];
      case "sent":
        return [heading("Recording sent.")];
      default:
        return null;
    }
  }

  function renderPanel() {
    const content = panelContent();
    backdrop.remove();
    if (!content) {
      panel.remove();
      return;
    }
    panel.dataset.variant = settings.variant;
    panel.replaceChildren(...content);
    // B takes the page: its panel is a dialog over a dimmed page, except once sent.
    if (settings.variant === "B") {
      if (session.phase !== "sent") shadow.append(backdrop);
      shadow.append(panel);
    } else {
      stack.append(panel);
    }
  }

  // ---- recording indicator ------------------------------------------------

  function pauseControl() {
    return session.phase === "paused"
      ? iconButton("play", "Resume recording", () => go("recording"))
      : iconButton("pause", "Pause recording", () => go("paused"));
  }

  function stopButton() {
    const button = el("button", "proto-stop");
    button.type = "button";
    button.append(icon("stop", 14), "Stop");
    button.addEventListener("click", () => stop());
    return button;
  }

  function discardIcon() {
    return confirmingDiscard
      ? link("Discard?", discard)
      : iconButton("close", "Discard recording", () => {
          confirmingDiscard = true;
          render();
          later(3000, () => {
            if (!confirmingDiscard) return;
            confirmingDiscard = false;
            render();
          });
        });
  }

  function statusLine() {
    if (session.phase === "reprompt") {
      return "Microphone paused. Answer your browser to continue.";
    }
    if (session.phase === "paused") return "Paused.";
    return flash;
  }

  function renderIndicator() {
    const { variant } = settings;
    liveNodes = { ...liveNodes, time: undefined, left: undefined };
    indicator.remove();
    frame.remove();
    pillNote.remove();
    counter.remove();
    if (session.phase === "countdown") {
      counter.textContent = String(countdown);
      shadow.append(counter);
      return;
    }
    if (!isCapturing()) return;
    const live = session.phase === "recording";
    indicator.dataset.live = String(live);
    const time = el("span", "proto-time");
    const left = el("span", "proto-left proto-muted");
    liveNodes.time = time;
    liveNodes.left = left;
    const dot = el("span", "proto-dot");
    const status = statusLine();

    if (variant === "A") {
      // The pill carries the clock; anything longer sits beside it.
      indicator.className = "proto-pill";
      indicator.replaceChildren(
        dot,
        time,
        pauseControl(),
        iconButton("stop", "Stop recording", () => stop()),
        discardIcon(),
      );
      stack.prepend(indicator);
      pillNote.replaceChildren(left);
      if (status) pillNote.prepend(`${status} `);
      liveNodes.left = left;
      indicator.after(pillNote);
      return;
    }
    if (variant === "B") {
      indicator.className = "proto-dock";
      const meter = el("span", "proto-meter");
      liveNodes.meter = Array.from({ length: 9 }, () => el("i"));
      meter.append(...liveNodes.meter);
      const track = el("span", "proto-track");
      const fill = el("i");
      track.append(fill);
      liveNodes.track = fill;
      indicator.replaceChildren(
        dot,
        ...(status ? [el("span", "", status)] : [meter]),
        time,
        track,
        left,
        pauseControl(),
        stopButton(),
        discardIcon(),
      );
      shadow.append(indicator);
      return;
    }
    indicator.className = "proto-chip";
    frame.dataset.live = String(live);
    indicator.replaceChildren(
      dot,
      el("span", "", status ?? "Recording the page and your voice"),
      time,
      left,
      stopButton(),
      discardIcon(),
    );
    shadow.append(frame, indicator);
  }

  // Runs on every tick: text only, so focus and typing are never disturbed.
  function updateLive() {
    const remaining = maxMs() - session.elapsedMs;
    const warning = remaining <= WARNING_MS;
    indicator.dataset.warning = String(warning);
    pillNote.dataset.warning = String(warning);
    if (liveNodes.time) liveNodes.time.textContent = clock(session.elapsedMs);
    if (liveNodes.left) {
      liveNodes.left.textContent =
        settings.variant === "B" && !warning
          ? clock(maxMs())
          : `${clock(remaining)} left`;
    }
    // A stays silent until the last seconds, unless it has something to say.
    pillNote.hidden =
      settings.variant !== "A" || (!warning && statusLine() === null);
    if (liveNodes.track) {
      liveNodes.track.style.width = `${(session.elapsedMs / maxMs()) * 100}%`;
    }
    for (const barNode of liveNodes.meter ?? []) {
      const level = session.phase === "recording" ? 3 + Math.random() * 13 : 3;
      barNode.style.height = `${level}px`;
    }
    if (liveNodes.bar) liveNodes.bar.style.width = `${progress * 100}%`;
    if (liveNodes.percent) {
      liveNodes.percent.textContent = `${Math.round(progress * 100)}%`;
    }
    barState.textContent = `phase=${session.phase} elapsed=${clock(session.elapsedMs)}/${clock(maxMs())} pageLoads=${session.loads} stopReason=${session.stopReason ?? "none"} leftover=${session.leftover} note=${JSON.stringify(session.note.slice(0, 24))}`;
  }

  // ---- simulated browser prompt -------------------------------------------

  function renderBrowser() {
    const asking = session.phase === "prompt" || session.phase === "reprompt";
    if (!asking) {
      browser.remove();
      return;
    }
    const block = el("button", "", "Block");
    const allow = el("button", "", "Allow");
    block.addEventListener("click", () =>
      session.phase === "reprompt" ? stop("load") : go("refused"),
    );
    allow.addEventListener("click", () =>
      session.phase === "reprompt" ? go("recording") : startCapture(),
    );
    const buttons = el("div");
    buttons.append(block, allow);
    browser.replaceChildren(
      el("small", "", "SIMULATED BROWSER PROMPT"),
      `${window.location.host} wants to use your microphone.`,
      buttons,
    );
    shadow.append(browser);
  }

  function render() {
    const name = bar.querySelector<HTMLElement>("[data-role=name]");
    const current = VARIANTS.find(({ key }) => key === settings.variant);
    if (name && current) name.textContent = `${current.key} (${current.name})`;
    // The toolbar gives way while the Widget is recording or asking to send.
    toolbar.hidden = isCapturing() || session.phase === "countdown";
    renderEntries();
    renderPanel();
    renderIndicator();
    renderBrowser();
    updateLive();
    save();
  }

  let lastTick = Date.now();
  const ticker = setInterval(() => {
    const now = Date.now();
    const delta = (now - lastTick) * Number(settings.speed);
    lastTick = now;
    // The replay keeps running while the browser asks again; only the voice is cut.
    if (session.phase === "recording" || session.phase === "reprompt") {
      session.elapsedMs = Math.min(maxMs(), session.elapsedMs + delta);
      if (session.elapsedMs >= maxMs()) {
        stop("limit");
        return;
      }
      save();
    }
    updateLive();
  }, TICK_MS);

  buildBar();
  // Once per document: React's development double mount is not a page load.
  const loadFlag = window as { __ffProtoLoaded?: boolean };
  if (!loadFlag.__ffProtoLoaded) resumeAfterLoad();
  loadFlag.__ffProtoLoaded = true;
  // Screenshot hook: lands straight on a state, bypassing the load rules.
  const forced = readJson<Session>("ff-proto-narrated-force");
  if (forced.phase) session = { ...fresh(), ...forced };
  render();

  return {
    destroy() {
      clearInterval(ticker);
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      trigger?.removeEventListener("click", onTrigger, true);
    },
  };
}
