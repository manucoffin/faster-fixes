// PROTOTYPE, throwaway. Question (issue 373): what does a Recording look and
// feel like for a Reviewer in the Widget?
// Four variants of the flow from the toolbar to a submitted Feedback,
// switchable via `?recordingVariant=A..D` and a floating bar (localhost only),
// on the real pages of the app. Nothing is recorded or uploaded: the buffer,
// the preview and the upload are simulated. The bar picks the buffer scenario
// (full, live clock, short, empty, turned off by the site).

const VARIANT_PARAM = "recordingVariant";
const BUFFER_PARAM = "recordingBuffer";
const BUFFER_MAX_SECONDS = 60;
const UPLOAD_MS = 4000;

const VARIANTS = [
  { key: "A", name: "Silent, like the Screenshot" },
  { key: "B", name: "Attachment row in the form" },
  { key: "C", name: "Preview first, send blocks" },
  { key: "D", name: "Toolbar indicator and switch" },
] as const;

const SCENARIOS = [
  { key: "full", name: "Buffer full (60 s)" },
  { key: "live", name: "Live clock since page load" },
  { key: "short", name: "Short buffer (3 s)" },
  { key: "empty", name: "Empty buffer" },
  { key: "off", name: "Site turned Recording off" },
] as const;

type VariantKey = (typeof VARIANTS)[number]["key"];
type ScenarioKey = (typeof SCENARIOS)[number]["key"];

export type RecordingPrototype = {
  onPopoverOpen: (screenshot: Promise<Blob | null>) => void;
  /** Awaited by the submit: only the blocking variant makes it wait. */
  afterSubmit: () => Promise<void>;
  onPopoverClosed: () => void;
  destroy: () => void;
};

const NOOP: RecordingPrototype = {
  onPopoverOpen() {},
  afterSubmit: () => Promise.resolve(),
  onPopoverClosed() {},
  destroy() {},
};

const CSS = `
  .proto-bar {
    position: fixed;
    top: 12px;
    left: 50%;
    z-index: var(--ff-z-index);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border: 2px dashed #facc15;
    border-radius: 999px;
    background: #000;
    color: #fff;
    font: 12px/1.3 ui-monospace, monospace;
    transform: translateX(-50%);
    pointer-events: auto;
    white-space: nowrap;
  }
  .proto-bar button, .proto-bar select {
    all: initial;
    padding: 2px 8px;
    border-radius: 6px;
    background: #27272a;
    color: #fff;
    font: inherit;
    cursor: pointer;
  }
  .proto-bar .proto-state { color: #facc15; }

  .proto-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 6px 8px;
    border: 1px solid #3f3f46;
    border-radius: calc(var(--ff-radius) - 2px);
    font-size: 12px;
  }
  .proto-row-text { flex: 1; min-width: 0; }
  .proto-dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
  }
  .proto-link {
    all: initial;
    color: #a1a1aa;
    font: 500 12px/1.3 var(--ff-font-family);
    text-decoration: underline;
    cursor: pointer;
  }
  .proto-link:hover { color: var(--ff-foreground); }
  .proto-muted { margin: 8px 0 0; color: #71717a; font-size: 12px; }

  .proto-player {
    position: relative;
    aspect-ratio: 16 / 9;
    margin: 0 0 8px;
    overflow: hidden;
    border: 1px solid #3f3f46;
    border-radius: calc(var(--ff-radius) - 2px);
    background: #27272a center / cover no-repeat;
  }
  .proto-player[data-inline] { margin: 8px 0 0; }
  .proto-cursor {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: var(--ff-accent);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    animation: proto-cursor 6s ease-in-out infinite;
  }
  .proto-time {
    position: absolute;
    right: 6px;
    bottom: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .proto-track {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.25);
  }
  .proto-track > span {
    display: block;
    height: 100%;
    background: var(--ff-accent);
    transform-origin: left;
    animation: proto-progress linear infinite;
  }
  .proto-check {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
    font-size: 12px;
    cursor: pointer;
  }
  .proto-excluded { opacity: 0.35; filter: grayscale(1); }
  .popover.proto-wide { width: 380px; }

  .proto-upload { margin-top: 8px; font-size: 12px; color: #a1a1aa; }
  .proto-upload-track {
    height: 4px;
    margin-top: 4px;
    overflow: hidden;
    border-radius: 2px;
    background: #3f3f46;
  }
  .proto-upload-track > span {
    display: block;
    height: 100%;
    background: var(--ff-accent);
  }

  .proto-toast {
    align-self: flex-end;
    width: 200px;
    padding: 8px 10px;
    border-radius: var(--ff-radius);
    background: var(--ff-background);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font-size: 12px;
  }

  .proto-ring {
    position: absolute;
    inset: -5px;
    padding: 3px;
    border-radius: 29px;
    pointer-events: none;
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
  }
  .proto-ring[data-busy] { animation: proto-spin 1s linear infinite; }
  .toolbar.proto-tall[data-state="expanded"] { height: 148px; }
  .proto-rec-icon {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
  }
  .control-pressed .proto-rec-icon { background: transparent; border: 2px solid #fff; }

  @keyframes proto-progress {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes proto-cursor {
    0% { top: 20%; left: 15%; }
    30% { top: 55%; left: 60%; }
    60% { top: 30%; left: 75%; }
    100% { top: 70%; left: 40%; }
  }
  @keyframes proto-spin {
    to { transform: rotate(360deg); }
  }
`;

function readParam<T extends string>(
  name: string,
  options: readonly { key: T }[],
  fallback: T,
): T {
  const value = new URLSearchParams(location.search).get(name);
  return options.find((option) => option.key === value)?.key ?? fallback;
}

function writeParam(name: string, value: string) {
  const url = new URL(location.href);
  url.searchParams.set(name, value);
  history.replaceState(history.state, "", url);
}

function spoken(seconds: number) {
  if (seconds >= 60) return "minute";
  return seconds === 1 ? "second" : `${seconds} seconds`;
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function mountRecordingPrototype(
  document: Document,
  shadow: ShadowRoot,
  toolbar: HTMLElement,
  stack: HTMLElement,
): RecordingPrototype {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) return NOOP;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);
  shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];

  const loadedAt = Date.now();
  let variant: VariantKey = readParam(VARIANT_PARAM, VARIANTS, "A");
  let scenario: ScenarioKey = readParam(BUFFER_PARAM, SCENARIOS, "full");
  // B and C: the Reviewer's choice for this Feedback. D: for the whole visit.
  let included = true;
  let paused = false;
  let upload: number | null = null;
  let uploadTimer: ReturnType<typeof setInterval> | null = null;
  let open: { popover: HTMLElement; screenshotUrl: string | null } | null =
    null;
  let frozenSeconds: number | null = null;

  function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className: string,
    text = "",
  ) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function liveSeconds() {
    if (scenario === "off" || scenario === "empty") return 0;
    if (scenario === "short") return 3;
    if (scenario === "full") return BUFFER_MAX_SECONDS;
    return Math.min(
      BUFFER_MAX_SECONDS,
      Math.floor((Date.now() - loadedAt) / 1000),
    );
  }

  // Frozen at the Selection click: recording is suspended in comment mode.
  function seconds() {
    return frozenSeconds ?? liveSeconds();
  }

  function willAttach() {
    if (scenario === "off" || seconds() === 0) return false;
    if (variant === "D") return !paused;
    if (variant === "B" || variant === "C") return included;
    return true;
  }

  // ---- floating bar -------------------------------------------------------

  const bar = el("div", "proto-bar");
  const previous = el("button", "", "←");
  const next = el("button", "", "→");
  const label = el("span", "");
  const scenarioSelect = document.createElement("select");
  for (const { key, name } of SCENARIOS) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = name;
    scenarioSelect.appendChild(option);
  }
  scenarioSelect.value = scenario;
  const stateLine = el("span", "proto-state");
  bar.append(previous, label, next, scenarioSelect, stateLine);
  shadow.appendChild(bar);

  function cycle(step: number) {
    const index = VARIANTS.findIndex(({ key }) => key === variant);
    variant =
      VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length]?.key ?? "A";
    writeParam(VARIANT_PARAM, variant);
    included = true;
    renderAll();
  }
  previous.addEventListener("click", () => cycle(-1));
  next.addEventListener("click", () => cycle(1));
  scenarioSelect.addEventListener("change", () => {
    scenario = scenarioSelect.value as ScenarioKey;
    writeParam(BUFFER_PARAM, scenario);
    if (frozenSeconds !== null) frozenSeconds = liveSeconds();
    renderAll();
  });

  function onKey(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const focused = shadow.activeElement ?? document.activeElement;
    if (focused?.matches("input, textarea, select, [contenteditable]")) return;
    cycle(event.key === "ArrowLeft" ? -1 : 1);
  }
  window.addEventListener("keydown", onKey);

  function renderBar() {
    const current = VARIANTS.find(({ key }) => key === variant);
    label.textContent = `${variant} (${current?.name})`;
    let recording = "none";
    if (scenario === "off") recording = "off by site";
    else if (upload !== null) {
      recording = `uploading ${Math.round(upload * 100)}%`;
    } else if (willAttach()) recording = "will attach";
    else if (seconds() > 0) recording = "kept out by Reviewer";
    stateLine.textContent = `buffer ${seconds()} s · recording: ${recording}`;
  }

  // ---- toolbar (variant D) ------------------------------------------------

  const ring = el("div", "proto-ring");
  const recordControl = el("button", "control");
  recordControl.type = "button";
  const recordTooltip = el("span", "tooltip");
  recordTooltip.dataset.side = "left";
  recordControl.append(el("span", "proto-rec-icon"), recordTooltip);
  recordControl.addEventListener("click", () => {
    paused = !paused;
    renderAll();
  });
  const triggerTooltip = toolbar.querySelector(".button .tooltip");
  const originalTriggerTooltip = triggerTooltip?.textContent ?? "";

  function renderToolbar() {
    const active = variant === "D" && scenario !== "off";
    if (triggerTooltip) {
      triggerTooltip.textContent = active
        ? `${originalTriggerTooltip}. The last minute on this page is attached.`
        : originalTriggerTooltip;
    }
    toolbar.classList.toggle("proto-tall", active);
    if (!active) {
      ring.remove();
      recordControl.remove();
      return;
    }
    if (!ring.isConnected) toolbar.appendChild(ring);
    if (!recordControl.isConnected) {
      toolbar.querySelector(".controls")?.prepend(recordControl);
    }
    recordControl.classList.toggle("control-pressed", paused);
    const controlLabel = paused
      ? "Attach recordings to my feedback"
      : "Stop attaching recordings";
    recordControl.setAttribute("aria-label", controlLabel);
    recordTooltip.textContent = controlLabel;

    const fill =
      upload ?? (paused ? 0 : (seconds() / BUFFER_MAX_SECONDS) * 100) / 100;
    const color =
      upload === null
        ? "color-mix(in srgb, var(--ff-accent) 45%, #fff)"
        : "#22c55e";
    ring.style.background = `conic-gradient(${color} ${fill * 360}deg, transparent 0)`;
  }

  // ---- popover ------------------------------------------------------------

  function createPlayer(inline: boolean) {
    const player = el("div", "proto-player");
    if (inline) player.dataset.inline = "";
    if (open?.screenshotUrl) {
      player.style.backgroundImage = `url(${open.screenshotUrl})`;
    }
    const track = el("div", "proto-track");
    const progress = el("span", "");
    progress.style.animationDuration = `${Math.max(seconds(), 1)}s`;
    track.appendChild(progress);
    player.append(
      el("span", "proto-cursor"),
      el("span", "proto-time", clock(seconds())),
      track,
    );
    return player;
  }

  function renderPopover() {
    if (!open) return;
    const { popover } = open;
    popover.querySelectorAll(".proto").forEach((node) => node.remove());
    popover.classList.toggle("proto-wide", variant === "C");
    const textarea = popover.querySelector(".textarea");
    const actions = popover.querySelector(".actions");
    if (!textarea || !actions || scenario === "off") return;
    const duration = seconds();

    if (variant === "B" && duration > 0) {
      const row = el("div", "proto proto-row");
      if (included) {
        const preview = el("button", "proto-link", "Preview");
        const remove = el("button", "proto-link", "Remove");
        row.append(
          el("span", "proto-dot"),
          el(
            "span",
            "proto-row-text",
            `Last ${spoken(duration)} on this page attached`,
          ),
          preview,
          remove,
        );
        preview.addEventListener("click", () => {
          const shown = popover.querySelector(".proto-player");
          if (shown) shown.remove();
          else {
            const player = createPlayer(true);
            player.classList.add("proto");
            row.after(player);
          }
          preview.textContent = shown ? "Preview" : "Hide";
        });
        remove.addEventListener("click", () => {
          included = false;
          renderAll();
        });
      } else {
        const undo = el("button", "proto-link", "Undo");
        row.append(el("span", "proto-row-text", "Recording removed"), undo);
        undo.addEventListener("click", () => {
          included = true;
          renderAll();
        });
      }
      textarea.after(row);
    }

    if (variant === "C") {
      if (duration === 0) {
        const note = el(
          "p",
          "proto proto-muted",
          "No recording for this feedback: the page has just loaded.",
        );
        note.style.margin = "0 0 8px";
        textarea.before(note);
      } else {
        const player = createPlayer(false);
        player.classList.add("proto");
        player.classList.toggle("proto-excluded", !included);
        const check = el("label", "proto proto-check");
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = included;
        box.addEventListener("change", () => {
          included = box.checked;
          renderAll();
        });
        check.append(
          box,
          `Attach the last ${spoken(duration)} before your click`,
        );
        textarea.before(player, check);
      }
      if (upload !== null) {
        const sending = el("div", "proto proto-upload", "Sending recording");
        const track = el("div", "proto-upload-track");
        const progress = el("span", "");
        progress.style.width = `${upload * 100}%`;
        track.appendChild(progress);
        sending.appendChild(track);
        actions.after(sending);
      }
    }

    if (variant === "D" && duration > 0) {
      actions.before(
        el(
          "p",
          "proto proto-muted",
          paused
            ? "No recording attached. Turn it back on from the toolbar."
            : `Includes the last ${spoken(duration)} on this page.`,
        ),
      );
    }
  }

  // ---- upload -------------------------------------------------------------

  const toast = el("div", "proto-toast");

  function renderToast() {
    if (variant !== "B" || upload === null) {
      toast.remove();
      return;
    }
    toast.textContent =
      upload < 1
        ? `Sending recording, ${Math.round(upload * 100)}%`
        : "Recording sent";
    if (!toast.isConnected) stack.appendChild(toast);
  }

  function simulateUpload() {
    return new Promise<void>((resolve) => {
      const startedAt = Date.now();
      upload = 0;
      renderAll();
      uploadTimer = setInterval(() => {
        upload = Math.min(1, (Date.now() - startedAt) / UPLOAD_MS);
        renderAll();
        if (upload < 1) return;
        if (uploadTimer !== null) clearInterval(uploadTimer);
        resolve();
        setTimeout(() => {
          upload = null;
          renderAll();
        }, 1200);
      }, 100);
    });
  }

  function renderAll() {
    renderBar();
    renderToolbar();
    renderPopover();
    renderToast();
  }

  const liveTick = setInterval(() => {
    if (scenario === "live" && frozenSeconds === null) renderAll();
  }, 1000);
  renderAll();

  return {
    onPopoverOpen(screenshot) {
      const popover = shadow.querySelector<HTMLElement>(".popover");
      if (!popover) return;
      frozenSeconds = liveSeconds();
      included = true;
      const current = { popover, screenshotUrl: null as string | null };
      open = current;
      renderAll();
      void screenshot.then((blob) => {
        if (!blob || open !== current) return;
        current.screenshotUrl = URL.createObjectURL(blob);
        const player = popover.querySelector<HTMLElement>(".proto-player");
        if (player) {
          player.style.backgroundImage = `url(${current.screenshotUrl})`;
        }
      });
    },
    afterSubmit() {
      if (!willAttach()) return Promise.resolve();
      const done = simulateUpload();
      return variant === "C" ? done : Promise.resolve();
    },
    onPopoverClosed() {
      open?.popover.classList.remove("proto-wide");
      open?.popover.querySelectorAll(".proto").forEach((node) => node.remove());
      open = null;
      frozenSeconds = null;
      renderAll();
    },
    destroy() {
      clearInterval(liveTick);
      if (uploadTimer !== null) clearInterval(uploadTimer);
      window.removeEventListener("keydown", onKey);
      bar.remove();
      toast.remove();
    },
  };
}
