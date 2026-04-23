import { SITE_NAME, SITE_TAGLINE } from "@/app/_constants/seo";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background:
          "radial-gradient(ellipse at top left, #1e293b 0%, #020617 60%)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        {SITE_NAME}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: 960,
          }}
        >
          Client feedback that fixes itself.
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          {SITE_TAGLINE}. Open source. MCP-ready.
        </div>
      </div>
    </div>,
    { ...size },
  );
}
