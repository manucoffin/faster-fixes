import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalStorage } from "./local";

const BUCKET = "uploads-test";
const KEY = "feedback-recordings/feedback_1/recording.gz";

let root: string;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "local-storage-"));
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("LocalStorage.get", () => {
  it("returns the stored bytes", async () => {
    const storage = new LocalStorage(root);
    const body = Buffer.from("recording-bytes");
    await storage.put({
      bucket: BUCKET,
      key: KEY,
      body,
      contentType: "application/gzip",
    });

    expect(await storage.get({ bucket: BUCKET, key: KEY })).toEqual(body);
  });

  it("reports an absent object as null", async () => {
    const storage = new LocalStorage(root);

    expect(
      await storage.get({ bucket: BUCKET, key: "feedback-recordings/none.gz" }),
    ).toBeNull();
  });
});
