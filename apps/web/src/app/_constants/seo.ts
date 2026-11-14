export const SITE_NAME = "FasterFixes";
export const SITE_TAGLINE = "Website feedback widget for developers";
export const SITE_META_DESCRIPTION =
  "Open-source website feedback widget for developer teams. Clients leave visual bug reports with full technical context, delivered to your AI coding agent via MCP.";

// Publisher logo for JSON-LD. Google's Article rich-result spec requires logo
// width/height — the 512×512 maskable icon already shipped via the PWA manifest
// is the simplest reusable source. Dimensions are strings because schema-dts
// types `width`/`height` as Schema.org `Distance` (which is a string).
export const PUBLISHER_LOGO = {
  url: "/images/android-chrome-512x512.png",
  width: "512",
  height: "512",
} as const;

export const SITE_LANGUAGE = "en";
export const SITE_OG_LOCALE = "en_US";

// The size every social card is rendered at by the `/og` route.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
