import { describe, expect, it } from "vitest";
import {
  formatElementForCopy,
  formatEnvironment,
  formatPagePath,
  getCustomMetadataRows,
  getElementContext,
} from "./feedback-detail";

const baseFeedback = {
  selector: null,
  metadata: null,
  browserName: null,
  browserVersion: null,
  os: null,
  viewportWidth: null,
  viewportHeight: null,
};

describe("getElementContext", () => {
  it("splits the React component path into bare component names", () => {
    const element = getElementContext({
      ...baseFeedback,
      metadata: { reactComponentPath: "<App> <Layout> <SaveButton>" },
    });

    expect(element.components).toEqual(["App", "Layout", "SaveButton"]);
  });

  it("ignores metadata values that are not non-empty strings", () => {
    const element = getElementContext({
      ...baseFeedback,
      metadata: { elementDescription: "", sourceFile: 42 },
    });

    expect(element).toMatchObject({
      description: null,
      sourceFile: null,
      components: [],
      hasContext: false,
    });
  });

  it("has context when any of description, path or source file is known", () => {
    const element = getElementContext({
      ...baseFeedback,
      metadata: { sourceFile: "src/app/page.tsx:12:4" },
    });

    expect(element.hasContext).toBe(true);
  });
});

describe("formatElementForCopy", () => {
  it("lists only the known fields, one per line", () => {
    const element = getElementContext({
      ...baseFeedback,
      selector: "#save",
      metadata: {
        elementDescription: 'button "Save"',
        reactComponentPath: "<App> <SaveButton>",
      },
    });

    expect(formatElementForCopy(element)).toBe(
      [
        'Element: button "Save"',
        "Component tree: <App> <SaveButton>",
        "DOM selector: #save",
      ].join("\n"),
    );
  });
});

describe("formatPagePath", () => {
  it("keeps the host and path, dropping protocol and query", () => {
    expect(formatPagePath("https://acme.com/pricing?ref=x")).toBe(
      "acme.com/pricing",
    );
  });

  it("shows the bare host for the root page", () => {
    expect(formatPagePath("https://acme.com/")).toBe("acme.com");
  });

  it("falls back to the raw value when it is not a URL", () => {
    expect(formatPagePath("not a url")).toBe("not a url");
  });
});

describe("formatEnvironment", () => {
  it("joins browser version, OS and viewport", () => {
    expect(
      formatEnvironment({
        ...baseFeedback,
        browserName: "Chrome",
        browserVersion: "128",
        os: "macOS",
        viewportWidth: 1440,
        viewportHeight: 900,
      }),
    ).toEqual({ browser: "Chrome 128", details: "macOS · 1440×900" });
  });

  it("returns nulls when nothing was captured", () => {
    expect(formatEnvironment(baseFeedback)).toEqual({
      browser: null,
      details: null,
    });
  });
});

describe("getCustomMetadataRows", () => {
  it("keeps the declared order and formats each primitive", () => {
    expect(
      getCustomMetadataRows({
        userId: "user_42",
        seats: 3,
        beta: true,
        trial: false,
        plan: null,
      }),
    ).toEqual([
      { key: "userId", value: "user_42" },
      { key: "seats", value: "3" },
      { key: "beta", value: "true" },
      { key: "trial", value: "false" },
      { key: "plan", value: "null" },
    ]);
  });

  it("yields no rows for a null column", () => {
    expect(getCustomMetadataRows(null)).toEqual([]);
  });
});
