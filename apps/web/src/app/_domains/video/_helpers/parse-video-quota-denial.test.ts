import { describe, expect, it } from "vitest";
import { parseVideoQuotaDenial } from "./parse-video-quota-denial";

describe("parseVideoQuotaDenial", () => {
  it.each([
    { kind: "videoCount", count: 1, limit: 1 },
    { kind: "videoFileSize", size: 3, cap: 2 },
    { kind: "videoStorage", used: 19, budget: 20 },
  ])("reads a $kind denial", (denial) => {
    expect(parseVideoQuotaDenial(JSON.stringify(denial))).toEqual(denial);
  });

  it("gives null for a plain sentence", () => {
    expect(
      parseVideoQuotaDenial("You are not a member of this project."),
    ).toBeNull();
  });

  it("gives null for JSON that is not a denial", () => {
    expect(parseVideoQuotaDenial('{"kind":"other"}')).toBeNull();
    expect(parseVideoQuotaDenial('{"kind":"videoCount","count":1}')).toBeNull();
    expect(parseVideoQuotaDenial("null")).toBeNull();
    expect(parseVideoQuotaDenial("42")).toBeNull();
  });
});
