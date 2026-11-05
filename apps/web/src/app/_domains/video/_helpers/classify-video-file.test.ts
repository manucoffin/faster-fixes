import { describe, expect, it } from "vitest";
import { classifyVideoFile, getVideoTailLength } from "./classify-video-file";

function box(type: string, ...payload: Uint8Array[]): Uint8Array {
  const size = 8 + payload.reduce((total, part) => total + part.length, 0);
  const bytes = new Uint8Array(size);
  new DataView(bytes.buffer).setUint32(0, size);
  bytes.set(ascii(type), 4);
  let offset = 8;
  for (const part of payload) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

function ascii(text: string): Uint8Array {
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}

function uint32s(...values: number[]): Uint8Array {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => view.setUint32(index * 4, value));
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(parts.reduce((total, p) => total + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

// version/flags, creation, modification, timescale, duration, then the rest
// of a version 0 mvhd.
function mvhd(timescale: number, duration: number) {
  return box("mvhd", uint32s(0, 0, 0, timescale, duration), new Uint8Array(80));
}

// A version 0 tkhd: 76 bytes of fields, then 16.16 width and height.
function tkhd(width: number, height: number) {
  return box("tkhd", new Uint8Array(76), uint32s(width << 16, height << 16));
}

function trak(handler: string, fourcc: string, width = 0, height = 0) {
  return box(
    "trak",
    tkhd(width, height),
    box(
      "mdia",
      box("hdlr", uint32s(0, 0), ascii(handler), new Uint8Array(12)),
      box(
        "minf",
        box(
          "stbl",
          box("stsd", uint32s(0, 1), box(fourcc, new Uint8Array(16))),
        ),
      ),
    ),
  );
}

type Fixture = {
  videoCodec?: string;
  audioCodec?: string | null;
  moovLast?: boolean;
  fragmented?: boolean;
};

function buildFile({
  videoCodec = "avc1",
  audioCodec = "mp4a",
  moovLast = false,
  fragmented = false,
}: Fixture = {}): Uint8Array {
  const ftyp = box("ftyp", ascii("isom"), uint32s(512), ascii("isomavc1"));
  const moov = box(
    "moov",
    mvhd(1000, 83_250),
    trak("vide", videoCodec, 1920, 1080),
    ...(audioCodec ? [trak("soun", audioCodec)] : []),
    ...(fragmented ? [box("mvex", box("trex", new Uint8Array(24)))] : []),
  );
  const mdat = box("mdat", new Uint8Array(64));
  return moovLast ? concat(ftyp, mdat, moov) : concat(ftyp, moov, mdat);
}

function classify(bytes: Uint8Array, fileName = "cut.mp4") {
  return classifyVideoFile({ fileName, fileSize: bytes.length, head: bytes });
}

describe("classifyVideoFile", () => {
  it("accepts avc1 with duration, dimensions and fast start", () => {
    expect(classify(buildFile())).toEqual({
      kind: "accepted",
      videoCodec: "avc1",
      durationMs: 83_250,
      width: 1920,
      height: 1080,
      hasFastStart: true,
      audio: "aac",
    });
  });

  it("accepts avc3", () => {
    expect(classify(buildFile({ videoCodec: "avc3" }))).toMatchObject({
      kind: "accepted",
      videoCodec: "avc3",
      durationMs: 83_250,
      width: 1920,
      height: 1080,
      hasFastStart: true,
    });
  });

  it("converts the movie timescale to milliseconds", () => {
    const bytes = buildFile();
    // Rewrite the mvhd timescale to 90 kHz and its duration to 2.5 s.
    const view = new DataView(bytes.buffer);
    const mvhdStart = bytes.findIndex(
      (_, index) =>
        String.fromCharCode(...bytes.subarray(index, index + 4)) === "mvhd",
    );
    view.setUint32(mvhdStart + 4 + 12, 90_000);
    view.setUint32(mvhdStart + 4 + 16, 225_000);

    expect(classify(bytes)).toMatchObject({ durationMs: 2_500 });
  });

  it("accepts moov after mdat with fast start false, reading the tail", () => {
    const bytes = buildFile({ moovLast: true });
    const head = bytes.subarray(0, 120);
    const tailLength = getVideoTailLength({ fileSize: bytes.length, head });

    expect(tailLength).not.toBeNull();
    expect(
      classifyVideoFile({
        fileName: "cut.mov",
        fileSize: bytes.length,
        head,
        tail: bytes.subarray(bytes.length - (tailLength ?? 0)),
      }),
    ).toMatchObject({ kind: "accepted", hasFastStart: false });
  });

  it("asks for no tail when moov comes first", () => {
    const bytes = buildFile();
    expect(getVideoTailLength({ fileSize: bytes.length, head: bytes })).toBe(
      null,
    );
  });

  it("refuses moov after mdat as unknown without the tail", () => {
    const bytes = buildFile({ moovLast: true });
    expect(
      classifyVideoFile({
        fileName: "cut.mov",
        fileSize: bytes.length,
        head: bytes.subarray(0, 120),
      }),
    ).toEqual({ kind: "refused", reason: "unknown" });
  });

  it.each(["hvc1", "hev1"])("refuses %s as HEVC", (videoCodec) => {
    expect(classify(buildFile({ videoCodec }))).toEqual({
      kind: "refused",
      reason: "hevc",
    });
  });

  it("refuses ap4h as ProRes", () => {
    expect(classify(buildFile({ videoCodec: "ap4h" }))).toEqual({
      kind: "refused",
      reason: "prores",
    });
  });

  it("refuses an EBML signature as WebM", () => {
    const bytes = concat(
      Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]),
      new Uint8Array(60),
    );
    expect(classify(bytes, "cut.mp4")).toEqual({
      kind: "refused",
      reason: "webm",
    });
  });

  it("refuses a .webm file name as WebM", () => {
    expect(classify(buildFile(), "cut.WebM")).toEqual({
      kind: "refused",
      reason: "webm",
    });
  });

  it("refuses a fragmented file as unknown", () => {
    expect(classify(buildFile({ fragmented: true }))).toEqual({
      kind: "refused",
      reason: "unknown",
    });
  });

  it("refuses a top-level moof as unknown", () => {
    const bytes = concat(buildFile(), box("moof", new Uint8Array(8)));
    expect(classify(bytes)).toEqual({ kind: "refused", reason: "unknown" });
  });

  it("refuses a truncated header as unknown", () => {
    const bytes = buildFile();
    expect(
      classifyVideoFile({
        fileName: "cut.mp4",
        fileSize: bytes.length,
        head: bytes.subarray(0, 40),
      }),
    ).toEqual({ kind: "refused", reason: "unknown" });
    expect(classify(bytes.subarray(0, 6))).toEqual({
      kind: "refused",
      reason: "unknown",
    });
  });

  it("refuses an unknown fourcc as unknown", () => {
    expect(classify(buildFile({ videoCodec: "vp09" }))).toEqual({
      kind: "refused",
      reason: "unknown",
    });
  });

  it("refuses bytes that are not ISO BMFF as unknown", () => {
    expect(classify(ascii("not a video file at all"))).toEqual({
      kind: "refused",
      reason: "unknown",
    });
  });

  it("flags AAC, other audio and no audio", () => {
    expect(classify(buildFile({ audioCodec: "mp4a" }))).toMatchObject({
      audio: "aac",
    });
    expect(classify(buildFile({ audioCodec: "ac-3" }))).toMatchObject({
      kind: "accepted",
      audio: "other",
    });
    expect(classify(buildFile({ audioCodec: null }))).toMatchObject({
      kind: "accepted",
      audio: "none",
    });
  });
});
