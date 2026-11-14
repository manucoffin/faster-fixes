import type { OgCardContent } from "../_helpers/og-cards";

type Props = OgCardContent;

const ACCENT = "#38bdf8";
const ACCENT_TEXT = "#7dd3fc";

function titleFontSize(title: string) {
  if (title.length <= 30) return 92;
  if (title.length <= 45) return 80;
  if (title.length <= 60) return 68;
  if (title.length <= 80) return 58;
  return 50;
}

// Mirrors the home-page hero dot background (a dim "/" on a 24px grid).
// Static SVG data URI tile: Satori does not support <canvas> or repeating CSS
// patterns reliably, but it does composite layered data-URI backgrounds.
const PATTERN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text x="12" y="16" font-family="monospace" font-size="8" fill="#f8fafc" fill-opacity="0.07" text-anchor="middle">/</text></svg>`;
const PATTERN_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(PATTERN_SVG).toString("base64")}`;

function splitTitle(title: string, highlight: string | undefined) {
  const index = highlight ? title.indexOf(highlight) : -1;
  if (!highlight || index === -1) {
    return { before: title, highlight: null, after: "" };
  }
  return {
    before: title.slice(0, index),
    highlight,
    after: title.slice(index + highlight.length),
  };
}

function words(text: string) {
  return text.split(" ").filter(Boolean);
}

export function OgCard({ eyebrow, title, highlight, tags = [] }: Props) {
  const parts = splitTitle(title, highlight);
  const fontSize = titleFontSize(title);
  const gap = Math.round(fontSize * 0.26);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: "#020617",
        backgroundImage: `url("${PATTERN_DATA_URI}"), radial-gradient(ellipse at bottom right, rgba(14, 116, 144, 0.35) 0%, rgba(2, 6, 23, 0) 55%), radial-gradient(ellipse at top left, #1e293b 0%, #020617 60%)`,
        backgroundRepeat: "repeat, no-repeat, no-repeat",
        backgroundSize: "24px 24px, 100% 100%, 100% 100%",
        color: "#f8fafc",
        fontFamily: "Space Grotesk",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            opacity: 0.75,
            letterSpacing: "-0.02em",
          }}
        >
          /fasterfixes
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ACCENT_TEXT,
            padding: "10px 22px",
            borderRadius: 999,
            border: "2px solid rgba(56, 189, 248, 0.4)",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
          }}
        >
          {eyebrow}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: gap,
          rowGap: Math.round(fontSize * 0.12),
          maxWidth: 1040,
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.08,
        }}
      >
        {words(parts.before).map((word, index) => (
          <div key={`before-${index}`} style={{ display: "flex" }}>
            {word}
          </div>
        ))}
        {parts.highlight && (
          // The dashed frame and numbered pin echo a Widget annotation.
          <div
            style={{
              display: "flex",
              position: "relative",
              color: ACCENT_TEXT,
              padding: "0 18px 6px",
              borderRadius: 14,
              border: `4px dashed ${ACCENT}`,
              backgroundColor: "rgba(56, 189, 248, 0.08)",
            }}
          >
            {parts.highlight}
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: -26,
                right: -26,
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                backgroundColor: ACCENT,
                color: "#020617",
                fontSize: 26,
                letterSpacing: 0,
                lineHeight: 1,
                border: "4px solid #020617",
              }}
            >
              1
            </div>
          </div>
        )}
        {words(parts.after).map((word, index) => (
          <div key={`after-${index}`} style={{ display: "flex" }}>
            {word}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                color: "#cbd5e1",
                padding: "10px 20px",
                borderRadius: 999,
                border: "2px solid #1e293b",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            color: "#64748b",
          }}
        >
          faster-fixes.com
        </div>
      </div>
    </div>
  );
}
