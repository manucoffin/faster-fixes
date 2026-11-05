import { describe, expect, it } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("shows bytes and kilobytes below a megabyte", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1_500)).toBe("2 KB");
  });

  it("rounds megabytes to a whole number", () => {
    expect(formatBytes(320_400_000)).toBe("320 MB");
    expect(formatBytes(999_499_999)).toBe("999 MB");
  });

  it("shows gigabytes with one decimal, dropping a trailing zero", () => {
    expect(formatBytes(4_230_000_000)).toBe("4.2 GB");
    expect(formatBytes(20_000_000_000)).toBe("20 GB");
  });
});
