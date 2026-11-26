// Encodes the same speech with each browser's MediaRecorder at several
// bitrates and writes the files to <out>/<browser>-<label>.<ext>.
//
// The speech reaches the recorder through Web Audio (a looping buffer into a
// MediaStreamDestination), so no microphone or permission is involved and the
// three engines encode identical input.
//
// Run from apps/web so Playwright resolves:
//   node <this file> <speech.wav> <out dir>
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { chromium, firefox, webkit } = require("@playwright/test");

const speechPath = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3] ?? "out");
mkdirSync(outDir, { recursive: true });
const speech = readFileSync(speechPath);

const server = createServer((request, response) => {
  if (request.url === "/speech.wav") {
    response.writeHead(200, { "content-type": "audio/wav" });
    response.end(speech);
    return;
  }
  response.writeHead(200, { "content-type": "text/html" });
  response.end("<!doctype html><button id=go>go</button>");
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// label, audioBitsPerSecond (null leaves the browser's default), seconds.
// Override with TAKES='[["64k",64000,20]]' and CHANNELS=2.
const takes = process.env.TAKES
  ? JSON.parse(process.env.TAKES)
  : [
      ["24k-1min", 24_000, 60],
      ["32k-1min", 32_000, 60],
      ["default-1min", null, 60],
      ["32k-5min", 32_000, 300],
    ];
// A microphone track is mono on most devices.
const channels = Number(process.env.CHANNELS ?? 1);

function recordInPage({ takes, useMicrophone, channels }) {
  return new Promise((resolve, reject) => {
    document.querySelector("#go").addEventListener("click", async () => {
      try {
        let stream;
        if (useMicrophone) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          const audio = new AudioContext();
          const data = await (await fetch("/speech.wav")).arrayBuffer();
          const source = audio.createBufferSource();
          source.buffer = await audio.decodeAudioData(data);
          source.loop = true;
          const destination = audio.createMediaStreamDestination();
          destination.channelCount = channels;
          destination.channelCountMode = "explicit";
          source.connect(destination);
          source.start();
          stream = destination.stream;
        }
        const track = stream.getAudioTracks()[0];
        const results = await Promise.all(
          takes.map(
            ([label, bits, seconds]) =>
              new Promise((done) => {
                const recorder = new MediaRecorder(
                  stream.clone(),
                  bits ? { audioBitsPerSecond: bits } : {},
                );
                const chunks = [];
                recorder.ondataavailable = (event) => chunks.push(event.data);
                recorder.onstop = async () => {
                  const blob = new Blob(chunks);
                  const bytes = new Uint8Array(await blob.arrayBuffer());
                  let binary = "";
                  for (let i = 0; i < bytes.length; i += 0x8000)
                    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
                  done({
                    label,
                    seconds,
                    mimeType: recorder.mimeType,
                    reportedBits: recorder.audioBitsPerSecond,
                    chunks: chunks.length,
                    base64: btoa(binary),
                  });
                };
                recorder.start(1000);
                setTimeout(() => recorder.stop(), seconds * 1000);
              }),
          ),
        );
        resolve({ settings: track.getSettings(), results });
      } catch (error) {
        reject(new Error(String(error)));
      }
    });
  });
}

async function run(name, browserType, launchOptions, useMicrophone) {
  const browser = await browserType.launch(launchOptions);
  const context = await browser.newContext(
    useMicrophone ? { permissions: ["microphone"] } : {},
  );
  const page = await context.newPage();
  await page.goto(origin);
  const pending = page.evaluate(recordInPage, { takes, useMicrophone, channels });
  await page.click("#go");
  const longest = Math.max(...takes.map(([, , seconds]) => seconds));
  let outcome;
  try {
    outcome = await Promise.race([
      pending,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${name}: no result in time`)), (longest + 30) * 1000),
      ),
    ]);
  } finally {
    await browser.close();
  }
  const { settings, results } = outcome;
  return results.map(({ base64, ...take }) => {
    const bytes = Buffer.from(base64, "base64");
    const extension = take.mimeType.includes("mp4") ? "mp4" : take.mimeType.includes("ogg") ? "ogg" : "webm";
    const file = `${name}-${take.label}.${extension}`;
    writeFileSync(path.join(outDir, file), bytes);
    return {
      browser: name,
      ...take,
      file,
      bytes: bytes.length,
      kbitPerSecond: +((bytes.length * 8) / take.seconds / 1000).toFixed(1),
      kilobytesPerMinute: +((bytes.length / take.seconds) * 60 / 1000).toFixed(0),
      settings,
    };
  });
}

const runs = await Promise.allSettled([
  run("chromium", chromium, {}, false),
  run("firefox", firefox, {}, false),
  run("webkit", webkit, {}, false),
]);
server.close();
server.closeAllConnections();

const rows = [];
for (const outcome of runs) {
  if (outcome.status === "fulfilled") rows.push(...outcome.value);
  else console.error("failed:", outcome.reason.message.slice(0, 300));
}
writeFileSync(path.join(outDir, "voice.json"), JSON.stringify(rows, null, 2));
for (const row of rows)
  console.log(
    row.browser.padEnd(20),
    row.label.padEnd(13),
    row.mimeType.padEnd(28),
    `${row.kbitPerSecond} kbit/s`,
    `${row.kilobytesPerMinute} KB/min`,
  );
