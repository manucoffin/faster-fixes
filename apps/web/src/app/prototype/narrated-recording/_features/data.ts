// PROTOTYPE, throwaway. Fake narrated Recording for issue #500:
// "How the team plays a narrated Recording in the inbox".
// Nothing here is read from the database and no sound plays.

export const DURATION_MS = 108_000;

export type VoiceLine = { start: number; end: number; text: string };

export const VOICE: VoiceLine[] = [
  {
    start: 800,
    end: 5200,
    text: "So I'm on the cart, and I want to change the quantity of the second item.",
  },
  {
    start: 6000,
    end: 10_500,
    text: "I click plus, and look, the total at the bottom does not move.",
  },
  {
    start: 12_000,
    end: 16_000,
    text: "It only updates if I reload the page, which nobody will do.",
  },
  {
    start: 22_500,
    end: 27_000,
    text: "Second thing, the promo code field. I type the code from the newsletter.",
  },
  {
    start: 28_500,
    end: 33_000,
    text: "And it says invalid, but no reason is given. Expired, wrong, I can't tell.",
  },
  { start: 36_000, end: 40_000, text: "Anyway, let's go on to checkout." },
  {
    start: 44_000,
    end: 48_500,
    text: "Here on checkout, the delivery options take a long time to appear.",
  },
  {
    start: 55_000,
    end: 60_000,
    text: "There, about ten seconds. And during that time the Pay button is clickable.",
  },
  {
    start: 62_000,
    end: 67_500,
    text: "If I click Pay before they load, nothing happens at all. No message.",
  },
  {
    start: 75_000,
    end: 80_000,
    text: "Last one. On a phone width this summary overlaps the form, I'll resize.",
  },
  {
    start: 84_000,
    end: 89_000,
    text: "See, the order summary sits on top of the address fields.",
  },
  {
    start: 96_000,
    end: 101_000,
    text: "That's it. The total not updating is the one that blocks us.",
  },
];

/** A full page load: neither the replay nor the voice was captured. */
export const GAPS = [{ start: 41_000, end: 42_600 }];

export const PAGES = [
  { start: 0, end: 41_000, path: "/cart" },
  { start: 42_600, end: DURATION_MS, path: "/checkout" },
];

export type Entry =
  | { kind: "step"; time: number; text: string; x?: number; y?: number }
  | { kind: "console"; time: number; level: "warn" | "error"; text: string }
  | {
      kind: "network";
      time: number;
      method: string;
      url: string;
      status: number;
      duration: number;
    }
  | { kind: "gap"; time: number; end: number; text: string };

export const ENTRIES: Entry[] = [
  {
    kind: "step",
    time: 1500,
    text: 'Clicked "Increase quantity"',
    x: 71,
    y: 43,
  },
  {
    kind: "step",
    time: 7000,
    text: 'Clicked "Increase quantity"',
    x: 71,
    y: 43,
  },
  {
    kind: "network",
    time: 7100,
    method: "PATCH",
    url: "/api/cart/items/2",
    status: 200,
    duration: 182,
  },
  {
    kind: "console",
    time: 7300,
    level: "warn",
    text: "Cart total stale: recalculation skipped",
  },
  { kind: "step", time: 23_500, text: 'Clicked "Promo code"', x: 30, y: 66 },
  { kind: "step", time: 25_000, text: 'Typed in "Promo code"' },
  { kind: "step", time: 27_500, text: 'Clicked "Apply"', x: 52, y: 66 },
  {
    kind: "network",
    time: 27_600,
    method: "POST",
    url: "/api/promo",
    status: 422,
    duration: 96,
  },
  {
    kind: "console",
    time: 27_900,
    level: "error",
    text: "POST /api/promo 422 (Unprocessable Content)",
  },
  { kind: "step", time: 38_500, text: 'Clicked "Checkout"', x: 78, y: 84 },
  {
    kind: "gap",
    time: 41_000,
    end: 42_600,
    text: "Page loaded. 1.6 s not recorded.",
  },
  { kind: "step", time: 42_600, text: "Opened /checkout" },
  {
    kind: "network",
    time: 43_500,
    method: "GET",
    url: "/api/delivery-options",
    status: 200,
    duration: 10_240,
  },
  { kind: "step", time: 57_000, text: 'Clicked "Pay"', x: 30, y: 84 },
  { kind: "step", time: 63_000, text: 'Clicked "Pay"', x: 30, y: 84 },
  {
    kind: "console",
    time: 63_100,
    level: "error",
    text: "TypeError: Cannot read properties of undefined (reading 'rate')",
  },
  { kind: "step", time: 64_200, text: 'Clicked "Pay"', x: 30, y: 84 },
  { kind: "step", time: 81_000, text: "Resized the window to 390 px" },
];

export function entryTone(entry: Entry): "plain" | "warning" | "error" {
  if (entry.kind === "console") {
    return entry.level === "error" ? "error" : "warning";
  }
  if (entry.kind === "network" && entry.status >= 400) return "error";
  return "plain";
}

export function entryText(entry: Entry): string {
  if (entry.kind === "network") {
    return `${entry.method} ${entry.url} ${String(entry.status)} ${formatDuration(entry.duration)}`;
  }
  return entry.text;
}

export function formatDuration(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${String(ms)} ms`;
}

export function timecode(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}

export function currentVoiceIndex(time: number) {
  let current = -1;
  for (const [index, line] of VOICE.entries()) {
    if (line.start <= time) current = index;
  }
  return current;
}

export function isInGap(time: number) {
  return GAPS.some((gap) => time >= gap.start && time < gap.end);
}

// Where "skip silence" lands: just before the next thing said or done, when
// nothing is said or happening for a while.
export function silenceJump(time: number): number | null {
  const busy: [number, number][] = [
    ...VOICE.map((line): [number, number] => [line.start, line.end]),
    ...ENTRIES.map((entry): [number, number] => [
      entry.time,
      entry.kind === "gap"
        ? entry.end
        : entry.time + (entry.kind === "network" ? entry.duration : 800),
    ]),
  ];
  if (busy.some(([start, end]) => time >= start && time < end)) return null;
  const next = Math.min(
    ...busy.map(([start]) => start).filter((start) => start > time),
    DURATION_MS,
  );
  return next - time > 1500 ? next - 400 : null;
}
