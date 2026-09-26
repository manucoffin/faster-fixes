const SVG_NS = "http://www.w3.org/2000/svg";

type IconShape = [
  tag: "path" | "line" | "circle",
  attributes: Record<string, string>,
];

const ICONS = {
  message: [
    [
      "path",
      { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    ],
  ],
  eye: [
    ["path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
  ],
  eyeOff: [
    [
      "path",
      {
        d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94",
      },
    ],
    [
      "path",
      {
        d: "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19",
      },
    ],
    ["line", { x1: "1", y1: "1", x2: "23", y2: "23" }],
    ["path", { d: "M14.12 14.12a3 3 0 1 1-4.24-4.24" }],
  ],
  close: [
    ["line", { x1: "18", y1: "6", x2: "6", y2: "18" }],
    ["line", { x1: "6", y1: "6", x2: "18", y2: "18" }],
  ],
} satisfies Record<string, IconShape[]>;

export type IconName = keyof typeof ICONS;

export function createIcon(
  document: Document,
  name: IconName,
  size: number,
  { filled = false } = {},
) {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [attribute, value] of Object.entries({
    width: String(size),
    height: String(size),
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: filled ? "none" : "currentColor",
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
