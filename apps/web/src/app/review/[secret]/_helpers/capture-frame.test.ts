import { describe, expect, it, vi } from "vitest";
import { captureFrame } from "./capture-frame";

const video = { videoWidth: 1920, videoHeight: 1080 } as unknown as Parameters<
  typeof captureFrame
>[0];

function fakeCanvas(toBlob: (callback: BlobCallback) => void) {
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage }),
    toBlob,
  };
  return { canvas, drawImage };
}

describe("captureFrame", () => {
  it("encodes the frame at the Video's natural size", async () => {
    const blob = new Blob(["jpeg"], { type: "image/jpeg" });
    const toBlob = vi.fn((callback: BlobCallback) => callback(blob));
    const { canvas, drawImage } = fakeCanvas(toBlob);

    await expect(captureFrame(video, () => canvas)).resolves.toBe(blob);
    expect(canvas).toMatchObject({ width: 1920, height: 1080 });
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1920, 1080);
    expect(toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/jpeg",
      expect.any(Number),
    );
  });

  it("returns no blob when the canvas is tainted", async () => {
    const { canvas } = fakeCanvas(() => {
      throw new DOMException("Tainted canvas", "SecurityError");
    });

    await expect(captureFrame(video, () => canvas)).resolves.toBeNull();
  });

  it("returns no blob before a frame is decoded", async () => {
    const createCanvas = vi.fn();

    await expect(
      captureFrame({ ...video, videoWidth: 0, videoHeight: 0 }, createCanvas),
    ).resolves.toBeNull();
    expect(createCanvas).not.toHaveBeenCalled();
  });

  it("returns no blob when encoding yields none", async () => {
    const { canvas } = fakeCanvas((callback) => callback(null));

    await expect(captureFrame(video, () => canvas)).resolves.toBeNull();
  });

  it("returns no blob past the Screenshot size limit", async () => {
    const huge = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]);
    const { canvas } = fakeCanvas((callback) => callback(huge));

    await expect(captureFrame(video, () => canvas)).resolves.toBeNull();
  });
});
