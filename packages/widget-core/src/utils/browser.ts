type BrowserInfo = {
  browserName: string;
  browserVersion: string;
  os: string;
  viewportWidth: number;
  viewportHeight: number;
};

/**
 * Detects browser name, version, OS, and viewport dimensions from the user agent.
 */
export function getBrowserInfo(): BrowserInfo {
  if (typeof window === "undefined") {
    return {
      browserName: "Unknown",
      browserVersion: "0",
      os: "Unknown",
      viewportWidth: 0,
      viewportHeight: 0,
    };
  }

  const ua = navigator.userAgent;

  const browserName = detectBrowserName(ua);
  const browserVersion = detectBrowserVersion(ua, browserName);
  const os = detectOS(ua, navigator.maxTouchPoints);

  return {
    browserName,
    browserVersion,
    os,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

function detectBrowserName(ua: string): string {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Unknown";
}

function detectBrowserVersion(ua: string, browser: string): string {
  const patterns: Record<string, RegExp> = {
    Firefox: /Firefox\/([\d.]+)/,
    Edge: /Edg\/([\d.]+)/,
    Chrome: /Chrome\/([\d.]+)/,
    Safari: /Version\/([\d.]+)/,
    Opera: /(?:Opera|OPR)\/([\d.]+)/,
  };

  const pattern = patterns[browser];
  if (!pattern) return "0";

  const match = ua.match(pattern);
  return match?.[1] ?? "0";
}

function detectOS(ua: string, maxTouchPoints: number): string {
  if (ua.includes("Windows")) return "Windows";
  // Android user agents also contain "Linux"
  if (ua.includes("Android")) return "Android";
  // iOS user agents also contain "like Mac OS X"
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  // iPadOS Safari in desktop mode sends a Mac user agent; no Mac has a touchscreen
  if (ua.includes("Macintosh") && maxTouchPoints > 1) return "iOS";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}
