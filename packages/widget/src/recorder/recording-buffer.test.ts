import { describe, expect, it } from "vitest";

import {
  createRecordingBuffer,
  fitRecording,
  type Recording,
} from "./recording-buffer.js";

type TestEvent = { kind: "snapshot" | "step" | "mutation"; at: number };

const SESSION = { navigationType: "load" };

function setup(options: { mutationThreshold?: number } = {}) {
  let time = 1_000_000;
  const clock = {
    advance(ms: number) {
      time += ms;
    },
  };
  // Emits synchronously, like rrweb's takeFullSnapshot.
  const takeFullSnapshot = () => {
    buffer.add({ kind: "snapshot", at: time });
  };
  const buffer = createRecordingBuffer<TestEvent, typeof SESSION>({
    takeFullSnapshot,
    marker: SESSION,
    now: () => time,
    mutationsOf: (event) => (event.kind === "mutation" ? 1 : 0),
    ...options,
  });
  // The recorder's own snapshot at start.
  takeFullSnapshot();

  const step = () => {
    buffer.add({ kind: "step", at: time });
  };
  // Advances the clock one second at a time, ticking like the caller's timer.
  const run = (seconds: number) => {
    for (let i = 0; i < seconds; i += 1) {
      clock.advance(1_000);
      buffer.tick();
      step();
    }
  };
  return { buffer, clock, step, run, start: time };
}

function kinds(recording: Recording<TestEvent, unknown> | undefined) {
  return recording?.events.map((event) => event.kind) ?? [];
}

describe("createRecordingBuffer", () => {
  it("starts a slice with a full snapshot every 30 seconds", () => {
    const { buffer, run, start } = setup();
    run(95);
    const snapshots = (buffer.copy()[0]?.events ?? [])
      .filter((event) => event.kind === "snapshot")
      .map((event) => event.at - start);
    expect(snapshots).toEqual([60_000, 90_000]);
  });

  it("does not start a slice before 30 seconds", () => {
    const { buffer, run } = setup();
    run(29);
    expect(
      kinds(buffer.copy()[0]).filter((kind) => kind === "snapshot"),
    ).toHaveLength(1);
  });

  it("keeps only the last two slices", () => {
    const { buffer, run, start } = setup();
    run(125);
    const [whole] = buffer.copy();
    expect(whole?.events[0]).toEqual({ kind: "snapshot", at: start + 90_000 });
    expect(whole?.events.every((event) => event.at >= start + 90_000)).toBe(
      true,
    );
  });

  it("holds less than 30 seconds before the page has been open that long", () => {
    const { buffer, run } = setup();
    run(3);
    const candidates = buffer.copy();
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.durationMs).toBe(3_000);
    expect(kinds(candidates[0])).toEqual(["snapshot", "step", "step", "step"]);
  });

  it("holds 30 to 60 seconds once warm", () => {
    const { buffer, run } = setup();
    run(60);
    for (let seconds = 61; seconds <= 180; seconds += 1) {
      run(1);
      const duration = buffer.copy()[0]?.durationMs ?? 0;
      expect(duration).toBeGreaterThanOrEqual(30_000);
      expect(duration).toBeLessThanOrEqual(60_000);
    }
  });

  it("leaves out a slice older than the window when no tick came", () => {
    const { buffer, clock, run } = setup();
    run(40);
    clock.advance(25_000);
    expect(buffer.copy()[0]?.durationMs).toBe(35_000);
    expect(buffer.copy()).toHaveLength(1);
  });

  it("returns a copy independent of the buffer", () => {
    const { buffer, run, step } = setup();
    run(5);
    const [first] = buffer.copy();
    const length = first?.events.length;
    step();
    run(40);
    expect(first?.events).toHaveLength(length ?? -1);
    const [second] = buffer.copy();
    expect(second?.events.length).toBeGreaterThan(0);
  });

  it("returns nothing when no event was recorded", () => {
    const buffer = createRecordingBuffer<TestEvent, null>({
      takeFullSnapshot: () => undefined,
      marker: null,
    });
    expect(buffer.copy()).toEqual([]);
  });

  it("drops the current slice past the mutation threshold and records the next one", () => {
    const { buffer, clock, run, start } = setup({ mutationThreshold: 5 });
    run(35);
    for (let i = 0; i < 6; i += 1) {
      buffer.add({ kind: "mutation", at: start });
    }
    // The dropped slice ignores events until the next one starts.
    run(10);
    const [whole, ...rest] = buffer.copy();
    expect(rest).toEqual([]);
    expect(whole?.events.every((event) => event.at < start + 30_000)).toBe(
      true,
    );

    clock.advance(15_000);
    run(5);
    const [next] = buffer.copy();
    expect(next?.events[0]).toEqual({ kind: "snapshot", at: start + 61_000 });
    expect(
      kinds(next)
        .slice(1)
        .every((kind) => kind === "step"),
    ).toBe(true);
  });

  it("empties the buffer on reset and starts over with a full snapshot", () => {
    const { buffer, run, clock, start } = setup();
    run(45);
    buffer.reset({ navigationType: "back" });
    const [whole, ...rest] = buffer.copy();
    expect(rest).toEqual([]);
    expect(whole?.events).toEqual([{ kind: "snapshot", at: start + 45_000 }]);
    expect(whole?.marker).toEqual({ navigationType: "back" });

    clock.advance(2_000);
    expect(buffer.copy()[0]?.durationMs).toBe(2_000);
  });

  describe("page-session marker", () => {
    it("is present while the Recording starts at the session's start", () => {
      const { buffer, run } = setup();
      run(45);
      const [whole, latest] = buffer.copy();
      expect(whole?.marker).toEqual(SESSION);
      expect(latest?.marker).toBeNull();
    });

    it("is absent once the oldest slice has been dropped", () => {
      const { buffer, run } = setup();
      run(65);
      expect(buffer.copy().map((recording) => recording.marker)).toEqual([
        null,
        null,
      ]);
    });

    it("is absent when the session's first slice was dropped for mutations", () => {
      const { buffer, run, start } = setup({ mutationThreshold: 1 });
      buffer.add({ kind: "mutation", at: start });
      buffer.add({ kind: "mutation", at: start });
      run(35);
      const [whole] = buffer.copy();
      expect(whole?.events.length).toBeGreaterThan(0);
      expect(whole?.marker).toBeNull();
    });
  });
});

describe("fitRecording", () => {
  const recording = (events: number): Recording<number, null> => ({
    events: Array.from({ length: events }, (_, i) => i),
    durationMs: events * 1_000,
    marker: null,
  });
  const measure = (candidate: Recording<number, null>) =>
    Promise.resolve({ size: candidate.events.length });

  it("returns the whole copy when it fits", async () => {
    const whole = recording(50);
    const result = await fitRecording([whole, recording(20)], 50, measure);
    expect(result).toEqual({ recording: whole, measured: { size: 50 } });
  });

  it("returns the latest slice alone when only it fits", async () => {
    const latest = recording(20);
    const result = await fitRecording([recording(60), latest], 50, measure);
    expect(result?.recording).toBe(latest);
  });

  it("returns nothing when no candidate fits", async () => {
    expect(
      await fitRecording([recording(80), recording(60)], 50, measure),
    ).toBeNull();
  });

  it("returns nothing when there is no candidate", async () => {
    expect(await fitRecording([], 50, measure)).toBeNull();
  });
});
