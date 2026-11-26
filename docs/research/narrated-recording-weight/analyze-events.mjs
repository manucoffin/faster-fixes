// Reads the scenario files written by record-events.mjs and prints, for each,
// the gzipped size of the events at 1, 5 and 10 minutes under several
// checkpoint intervals.
//
// The capture took a checkpoint (Meta + FullSnapshot) every minute. A coarser
// interval is simulated by dropping the checkpoints it would not have taken,
// then gzipping what is left as one JSON array, the layout of a Recording
// file. Snapshots that open a page load are never dropped.
//
//   node <this file> <dir of scenario files>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const dir = path.resolve(process.argv[2]);
const META = 4;
const FULL_SNAPSHOT = 2;
const INCREMENTAL = 3;
const MINUTE = 60_000;
const DURATIONS = [1, 5, 10];
const INTERVALS = [1, 2, 5, Infinity];

const gz = (events) => gzipSync(JSON.stringify(events)).length;
const kb = (bytes) => Math.round(bytes / 1000);
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

function analyze(file) {
  const capture = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  const { scenario, stats, loads, dom } = capture;
  // The init script also runs in the blank document a new tab opens with;
  // the capture starts at the first snapshot of a real page.
  const first = capture.events.findIndex(
    (event, index) =>
      event.type === META &&
      capture.events[index + 1]?.type === FULL_SNAPSHOT &&
      gz([capture.events[index + 1]]) > 1000,
  );
  const events = capture.events.slice(first);
  const start = events[0].timestamp;

  // A checkpoint is a Meta event and the FullSnapshot after it. The recorder
  // takes one when it starts, so at each page load, then one every minute on
  // a timer started at the same instant: a checkpoint that does not fall on a
  // whole minute since the last page load opens a new one.
  const checkpoints = [];
  let loadStartedAt = start;
  events.forEach((event, index) => {
    if (event.type !== META) return;
    const snapshot = events[index + 1];
    if (snapshot?.type !== FULL_SNAPSHOT) return;
    const sinceLoad = event.timestamp - loadStartedAt;
    const offMinute = Math.abs(sinceLoad - Math.round(sinceLoad / MINUTE) * MINUTE);
    const opensLoad = index === 0 || sinceLoad < MINUTE / 2 || offMinute > 500;
    if (opensLoad) loadStartedAt = event.timestamp;
    checkpoints.push({
      index,
      minute: (event.timestamp - start) / MINUTE,
      bytes: gz([event, snapshot]),
      opensLoad,
    });
  });

  const table = {};
  for (const minutes of DURATIONS) {
    const end = start + minutes * MINUTE;
    if (events.at(-1).timestamp < end - 5_000) continue;
    table[minutes] = {};
    for (const interval of INTERVALS) {
      const dropped = new Set();
      let lastKept = 0;
      for (const checkpoint of checkpoints) {
        if (checkpoint.opensLoad) {
          lastKept = checkpoint.minute;
          continue;
        }
        if (checkpoint.minute - lastKept >= interval - 0.05) {
          lastKept = checkpoint.minute;
          continue;
        }
        dropped.add(checkpoint.index).add(checkpoint.index + 1);
      }
      const kept = events.filter(
        (event, index) => event.timestamp < end && !dropped.has(index),
      );
      table[minutes][interval] = gz(kept);
    }
  }

  const perMinute = [];
  for (let minute = 0; minute < 10; minute += 1) {
    const slice = events.filter(
      (event) =>
        event.type === INCREMENTAL &&
        event.timestamp >= start + minute * MINUTE &&
        event.timestamp < start + (minute + 1) * MINUTE,
    );
    if (slice.length) perMinute.push(gz(slice));
  }

  return {
    name: scenario.name,
    url: scenario.url,
    stats,
    loads: loads.length,
    elements: dom?.elements,
    startMs: dom?.startMs && Math.round(dom.startMs),
    events: events.length,
    snapshotBytes: checkpoints.map((checkpoint) => checkpoint.bytes),
    loadSnapshots: checkpoints.filter((checkpoint) => checkpoint.opensLoad).length,
    activityPerMinute: perMinute,
    table,
  };
}

const results = readdirSync(dir)
  .filter((file) => file.endsWith(".json") && file !== "summary.json")
  .map(analyze);
writeFileSync(path.join(dir, "summary.json"), JSON.stringify(results, null, 2));

for (const result of results) {
  console.log(`\n## ${result.name} (${result.url})`);
  console.log(
    `events ${result.events}, loads ${result.loads}, load snapshots ${result.loadSnapshots}, elements at end ${result.elements}, interaction ${JSON.stringify(result.stats)}`,
  );
  console.log(
    `full snapshot gz KB: min ${kb(Math.min(...result.snapshotBytes))}, median ${kb(median(result.snapshotBytes))}, max ${kb(Math.max(...result.snapshotBytes))} (${result.snapshotBytes.length} snapshots)`,
  );
  console.log(
    `activity gz KB per minute: min ${kb(Math.min(...result.activityPerMinute))}, median ${kb(median(result.activityPerMinute))}, max ${kb(Math.max(...result.activityPerMinute))}`,
  );
  console.log("gz KB      | every 1 min | every 2 min | every 5 min | none");
  for (const [minutes, row] of Object.entries(result.table))
    console.log(
      `${String(minutes).padStart(2)} min     | ${INTERVALS.map((interval) => String(kb(row[interval])).padStart(11)).join(" | ")}`,
    );
}
