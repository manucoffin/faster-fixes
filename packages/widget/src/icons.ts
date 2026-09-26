const SVG_NS = "http://www.w3.org/2000/svg";

type IconShape = [tag: "path" | "line", attributes: Record<string, string>];

const ICONS = {
  message: [
    [
      "path",
      { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    ],
  ],
  close: [
    ["line", { x1: "18", y1: "6", x2: "6", y2: "18" }],
    ["line", { x1: "6", y1: "6", x2: "18", y2: "18" }],
  ],
} satisfies Record<string, IconShape[]>;

export type IconName = keyof typeof ICONS;

export function createIcon(document: Document, name: IconName, size: number) {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [attribute, value] of Object.entries({
    width: String(size),
    height: String(size),
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  })) {
    svg.setAttribute(attribute, value);
  }
  for (const [tag, attributes] of ICONS[name] as IconShape[]) {
    const shape = document.createElementNS(SVG_NS, tag);
    for (const [attribute, value] of Object.entries(attributes)) {
      shape.setAttribute(attribute, value);
    }
    svg.appendChild(shape);
  }
  return svg;
}
