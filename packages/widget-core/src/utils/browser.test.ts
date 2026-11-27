import { afterEach, describe, expect, it, vi } from "vitest";

import { getBrowserInfo } from "./browser.js";

function stubBrowser(userAgent: string, maxTouchPoints = 0) {
  vi.stubGlobal("window", { innerWidth: 1280, innerHeight: 800 });
  vi.stubGlobal("navigator", { userAgent, maxTouchPoints });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getBrowserInfo os", () => {
  it("reports Windows for Chrome on Windows", () => {
    stubBrowser(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );

    expect(getBrowserInfo().os).toBe("Windows");
  });

  it("reports macOS for Safari on a Mac without touch", () => {
    stubBrowser(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    );

    expect(getBrowserInfo().os).toBe("macOS");
  });

  it("reports Linux for Firefox on desktop Linux", () => {
    stubBrowser(
      "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
    );

    expect(getBrowserInfo().os).toBe("Linux");
  });

  it("reports Android for Chrome on an Android phone", () => {
    stubBrowser(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      5,
    );

    expect(getBrowserInfo().os).toBe("Android");
  });

  it("reports iOS for Safari on an iPhone", () => {
    stubBrowser(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      5,
    );

    expect(getBrowserInfo().os).toBe("iOS");
  });

  it("reports iOS for Safari on an iPod touch", () => {
    stubBrowser(
      "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.6 Mobile/15E148 Safari/604.1",
      5,
    );

    expect(getBrowserInfo().os).toBe("iOS");
  });

  it("reports iOS for Safari on an iPad in mobile mode", () => {
    stubBrowser(
      "Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      5,
    );

    expect(getBrowserInfo().os).toBe("iOS");
  });

  it("reports iOS for Safari on an iPad in desktop mode, which sends a Mac user agent", () => {
    stubBrowser(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
      5,
    );

    expect(getBrowserInfo().os).toBe("iOS");
  });
});
