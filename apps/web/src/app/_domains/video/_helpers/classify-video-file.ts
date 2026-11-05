export type VideoFileClassification =
  | {
      kind: "accepted";
      videoCodec: "avc1" | "avc3";
      durationMs: number;
      width: number;
      height: number;
      hasFastStart: boolean;
      audio: "aac" | "other" | "none";
    }
  | { kind: "refused"; reason: "hevc" | "prores" | "webm" | "unknown" };

type VideoFileBytes = {
  fileName: string;
  fileSize: number;
  /** The first bytes of the file. */
  head: Uint8Array;
  /** The last bytes of the file, read when `moov` trails `mdat`. */
  tail?: Uint8Array;
};

type Box = { type: string; start: number; end: number; headerSize: number };

const HEVC_CODECS = new Set(["hvc1", "hev1", "dvh1", "dvhe"]);
const PRORES_CODECS = new Set(["apch", "apcn", "apcs", "apco", "ap4h", "ap4x"]);
const EBML_SIGNATURE = [0x1a, 0x45, 0xdf, 0xa3];

const unknown = { kind: "refused", reason: "unknown" } as const;

/**
 * Says whether the product accepts a video file, from its leading bytes and,
 * when the `moov` box trails `mdat`, its trailing bytes. Only progressive
 * ISO BMFF with an H.264 video track is accepted.
 */
export function classifyVideoFile({
  fileName,
  fileSize,
  head,
  tail,
}: VideoFileBytes): VideoFileClassification {
  if (/\.webm$/i.test(fileName) || startsWith(head, EBML_SIGNATURE)) {
    return { kind: "refused", reason: "webm" };
  }

  try {
    const read = createReader(head, fileSize, tail);
    const boxes = walkTopLevelBoxes(read, fileSize);
    if (!boxes || boxes.some((box) => box.type === "moof")) {
      return unknown;
    }

    const moov = boxes.find((box) => box.type === "moov");
    const mdat = boxes.find((box) => box.type === "mdat");
    if (!moov) {
      return unknown;
    }

    const bytes = read(moov.start + moov.headerSize, moov.end);
    if (!bytes) {
      return unknown;
    }

    const movie = parseMovie(bytes);
    if (!movie) {
      return unknown;
    }
    if (HEVC_CODECS.has(movie.videoCodec)) {
      return { kind: "refused", reason: "hevc" };
    }
    if (PRORES_CODECS.has(movie.videoCodec)) {
      return { kind: "refused", reason: "prores" };
    }
    if (movie.videoCodec !== "avc1" && movie.videoCodec !== "avc3") {
      return unknown;
    }

    return {
      kind: "accepted",
      videoCodec: movie.videoCodec,
      durationMs: movie.durationMs,
      width: movie.width,
      height: movie.height,
      hasFastStart: !mdat || moov.start < mdat.start,
      audio: movie.audio,
    };
  } catch {
    return unknown;
  }
}

/**
 * How many trailing bytes `classifyVideoFile` needs as `tail`: everything
 * after `mdat` when the head shows `mdat` before any `moov`, otherwise null.
 */
export function getVideoTailLength({
  fileSize,
  head,
}: Omit<VideoFileBytes, "fileName" | "tail">): number | null {
  const read = createReader(head, fileSize);
  let offset = 0;

  while (offset + 8 <= head.length) {
    const box = readBoxHeader(read, offset, fileSize);
    if (!box || box.type === "moov") {
      return null;
    }
    if (box.type === "mdat") {
      return box.end < fileSize ? fileSize - box.end : null;
    }
    offset = box.end;
  }
  return null;
}

type ByteReader = (start: number, end: number) => DataView | null;

// The file is seen through two windows, the head from offset 0 and the tail
// ending at the file size; a range is readable only if one window holds it.
function createReader(
  head: Uint8Array,
  fileSize: number,
  tail?: Uint8Array,
): ByteReader {
  const tailStart = tail ? fileSize - tail.length : Infinity;

  return (start, end) => {
    if (start < 0 || end < start) {
      return null;
    }
    if (end <= head.length) {
      return new DataView(head.buffer, head.byteOffset + start, end - start);
    }
    if (tail && start >= tailStart && end <= fileSize) {
      return new DataView(
        tail.buffer,
        tail.byteOffset + start - tailStart,
        end - start,
      );
    }
    return null;
  };
}

function walkTopLevelBoxes(read: ByteReader, fileSize: number): Box[] | null {
  const boxes: Box[] = [];
  let offset = 0;

  while (offset < fileSize) {
    const box = readBoxHeader(read, offset, fileSize);
    if (!box) {
      // Stop at the first unreadable header once both boxes that matter are
      // known; anything after them is irrelevant to the classification.
      const known = new Set(boxes.map(({ type }) => type));
      return known.has("moov") && known.has("mdat") ? boxes : null;
    }
    if (boxes.length === 0 && box.type !== "ftyp") {
      return null;
    }
    boxes.push(box);
    offset = box.end;
  }
  return boxes;
}

function readBoxHeader(
  read: ByteReader,
  start: number,
  containerEnd: number,
): Box | null {
  const header = read(start, start + 8);
  if (!header) {
    return null;
  }

  const size32 = header.getUint32(0);
  const type = readFourcc(header, 4);
  let size = size32;
  let headerSize = 8;

  if (size32 === 1) {
    const large = read(start + 8, start + 16);
    if (!large) {
      return null;
    }
    size = Number(large.getBigUint64(0));
    headerSize = 16;
  } else if (size32 === 0) {
    size = containerEnd - start;
  }

  if (size < headerSize || start + size > containerEnd) {
    return null;
  }
  return { type, start, end: start + size, headerSize };
}

type Movie = {
  videoCodec: string;
  durationMs: number;
  width: number;
  height: number;
  audio: "aac" | "other" | "none";
};

function parseMovie(moov: DataView): Movie | null {
  const children = listChildren(moov);
  if (children.some((child) => child.type === "mvex")) {
    return null;
  }

  const mvhd = children.find((child) => child.type === "mvhd");
  const durationMs = mvhd ? readMovieDurationMs(mvhd.data) : null;
  if (!durationMs) {
    return null;
  }

  const tracks = children
    .filter((child) => child.type === "trak")
    .map((trak) => parseTrack(trak.data));
  const video = tracks.find((track) => track?.handler === "vide");
  const audio = tracks.find((track) => track?.handler === "soun");
  if (!video) {
    return null;
  }

  return {
    videoCodec: video.sampleEntry,
    durationMs,
    width: video.width,
    height: video.height,
    audio: readAudioKind(audio?.sampleEntry),
  };
}

function readAudioKind(sampleEntry: string | undefined): Movie["audio"] {
  if (!sampleEntry) {
    return "none";
  }
  return sampleEntry === "mp4a" ? "aac" : "other";
}

function readMovieDurationMs(mvhd: DataView): number | null {
  const version = mvhd.getUint8(0);
  const timescale = mvhd.getUint32(version === 1 ? 20 : 12);
  const duration =
    version === 1 ? Number(mvhd.getBigUint64(24)) : mvhd.getUint32(16);
  return timescale > 0 ? Math.round((duration * 1000) / timescale) : null;
}

function parseTrack(trak: DataView) {
  const children = listChildren(trak);
  const tkhd = children.find((child) => child.type === "tkhd")?.data;
  const mdia = findChild(children, "mdia");
  const hdlr = mdia && findChild(listChildren(mdia), "hdlr");
  const stsd = mdia && findPath(mdia, ["minf", "stbl", "stsd"]);
  if (!tkhd || !hdlr || !stsd) {
    return null;
  }

  // tkhd ends with the 16.16 fixed-point width and height.
  const dimensions = tkhd.byteLength - 8;
  return {
    handler: readFourcc(hdlr, 8),
    // stsd: version and flags, entry count, then the first sample entry box.
    sampleEntry: readFourcc(stsd, 12),
    width: tkhd.getUint32(dimensions) >>> 16,
    height: tkhd.getUint32(dimensions + 4) >>> 16,
  };
}

type Child = { type: string; data: DataView };

function listChildren(container: DataView): Child[] {
  const read: ByteReader = (start, end) =>
    end <= container.byteLength
      ? new DataView(
          container.buffer,
          container.byteOffset + start,
          end - start,
        )
      : null;
  const children: Child[] = [];
  let offset = 0;

  while (offset + 8 <= container.byteLength) {
    const box = readBoxHeader(read, offset, container.byteLength);
    if (!box) {
      throw new Error(`Malformed box at ${offset}`);
    }
    const data = read(box.start + box.headerSize, box.end);
    if (data) {
      children.push({ type: box.type, data });
    }
    offset = box.end;
  }
  return children;
}

function findChild(children: Child[], type: string): DataView | undefined {
  return children.find((child) => child.type === type)?.data;
}

function findPath(container: DataView, path: string[]): DataView | undefined {
  return path.reduce<DataView | undefined>(
    (current, type) => current && findChild(listChildren(current), type),
    container,
  );
}

function readFourcc(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}
