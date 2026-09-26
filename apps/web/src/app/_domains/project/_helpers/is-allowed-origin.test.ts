import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "./is-allowed-origin";

function headersWithOrigin(origin: string): Headers {
  return new Headers({ origin });
}

describe("isAllowedOrigin", () => {
  it("accepts the registered domain", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("https://acme.com"), "acme.com"),
    ).toBe(true);
  });

  it("accepts the www form of the registered domain", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("https://www.acme.com"), "acme.com"),
    ).toBe(true);
  });

  it("accepts any subdomain of the registered domain", () => {
    expect(
      isAllowedOrigin(
        headersWithOrigin("https://staging.acme.com"),
        "acme.com",
      ),
    ).toBe(true);
    expect(
      isAllowedOrigin(
        headersWithOrigin("https://preview.app.acme.com"),
        "acme.com",
      ),
    ).toBe(true);
  });

  it("ignores the scheme, the port and the path", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("http://acme.com:3000"), "acme.com"),
    ).toBe(true);
    expect(
      isAllowedOrigin(headersWithOrigin("https://acme.com/inbox"), "acme.com"),
    ).toBe(true);
  });

  it("normalizes the registered domain the same way as the origin", () => {
    expect(
      isAllowedOrigin(
        headersWithOrigin("https://acme.com"),
        "https://www.ACME.com/",
      ),
    ).toBe(true);
  });

  it("accepts a localhost origin on any port or scheme", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("http://localhost:5173"), "acme.com"),
    ).toBe(true);
    expect(
      isAllowedOrigin(headersWithOrigin("https://127.0.0.1:8080"), "acme.com"),
    ).toBe(true);
  });

  // URL.hostname keeps the brackets of an IPv6 literal ("[::1]"), so the "::1"
  // entry of the localhost set never matches. Recorded as it stands: this
  // ticket relocates the matcher and changes no behaviour.
  it("refuses an IPv6 localhost origin as it stands today", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("http://[::1]:3000"), "acme.com"),
    ).toBe(false);
  });

  it("refuses a hostname that only ends with the localhost label", () => {
    expect(
      isAllowedOrigin(
        headersWithOrigin("https://localhost.evil.com"),
        "acme.com",
      ),
    ).toBe(false);
  });

  it("refuses a suffix that is not a subdomain", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("https://evil-acme.com"), "acme.com"),
    ).toBe(false);
    expect(
      isAllowedOrigin(headersWithOrigin("https://notacme.com"), "acme.com"),
    ).toBe(false);
  });

  it("refuses a registered domain used as a prefix of another domain", () => {
    expect(
      isAllowedOrigin(
        headersWithOrigin("https://acme.com.evil.com"),
        "acme.com",
      ),
    ).toBe(false);
  });

  it("refuses an unrelated domain", () => {
    expect(
      isAllowedOrigin(headersWithOrigin("https://evil.com"), "acme.com"),
    ).toBe(false);
  });

  it("falls back to the referer when no origin header is sent", () => {
    const headers = new Headers({ referer: "https://app.acme.com/page?q=1" });
    expect(isAllowedOrigin(headers, "acme.com")).toBe(true);
  });

  it("refuses a request that carries neither an origin nor a referer", () => {
    expect(isAllowedOrigin(new Headers(), "acme.com")).toBe(false);
  });

  it("refuses when the origin or the registered domain cannot be normalized", () => {
    expect(isAllowedOrigin(headersWithOrigin("not a url"), "acme.com")).toBe(
      false,
    );
    expect(isAllowedOrigin(headersWithOrigin("https://acme.com"), "")).toBe(
      false,
    );
  });
});
