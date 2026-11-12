import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@fasterfixes/core";

import { uploadRecording } from "./recording-upload.js";

describe("uploadRecording", () => {
  it("sends once when the upload succeeds", async () => {
    const attach = vi.fn(() => Promise.resolve());

    await uploadRecording(attach);

    expect(attach).toHaveBeenCalledTimes(1);
  });

  it("retries once after a network error, then gives up silently", async () => {
    const attach = vi.fn(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    );

    await expect(uploadRecording(attach)).resolves.toBeUndefined();

    expect(attach).toHaveBeenCalledTimes(2);
  });

  it("does not retry a refusal", async () => {
    const attach = vi.fn(() => Promise.reject(new ApiError(409, "Conflict")));

    await expect(uploadRecording(attach)).resolves.toBeUndefined();

    expect(attach).toHaveBeenCalledTimes(1);
  });
});
