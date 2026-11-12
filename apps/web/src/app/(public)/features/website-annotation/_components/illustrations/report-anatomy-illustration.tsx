import { PlayIcon } from "lucide-react";

const ARIA_LABEL =
  "Anatomy of one feedback: the screenshot of a pricing page with the clicked card outlined, and leader lines out to each captured field: the page URL /pricing, the CSS selector .card:nth-child(2), a click at 720, 672 in a 1440 by 900 viewport, Chrome 131 on macOS 15, one console error, 14 network requests and a recording of the last 60 seconds.";

// Side by side, everything is placed on a 100 x 75 canvas (the 4:3 box), and
// the screenshot frame sits at FRAME_LEFT, FRAME_TOP, FRAME_WIDTH units with
// its own 4:3 ratio. The frame's `@min-[30rem]:` classes repeat these values.
const CANVAS_HEIGHT = 75;
const FRAME_LEFT = 0;
const FRAME_TOP = 10;
const FRAME_WIDTH = 60;
const FRAME_HEIGHT = (FRAME_WIDTH * 3) / 4;

// Where right-hand callouts start, and the top of the callouts below the frame.
const CALLOUT_RIGHT_X = 65;
const CALLOUT_BELOW_Y = 60;

type Point = { x: number; y: number };

type Field = {
  label: string;
  value: string;
  // Percentages of the screenshot frame.
  anchor: Point;
  callout: "right" | "below";
  tone?: "error";
};

const FIELDS: readonly Field[] = [
  {
    label: "URL",
    value: "/pricing",
    anchor: { x: 64, y: 5.5 },
    callout: "right",
  },
  {
    label: "Selector",
    value: ".card:nth-child(2)",
    anchor: { x: 64, y: 46.5 },
    callout: "right",
  },
  {
    label: "Click",
    value: "720, 672 · 1440 × 900",
    anchor: { x: 50, y: 67 },
    callout: "right",
  },
  {
    label: "Browser",
    value: "Chrome 131 · macOS 15",
    anchor: { x: 100, y: 26 },
    callout: "right",
  },
  {
    label: "Console",
    value: "1 error",
    anchor: { x: 50, y: 93 },
    callout: "below",
    tone: "error",
  },
  {
    label: "Network",
    value: "14 requests",
    anchor: { x: 14, y: 93 },
    callout: "below",
  },
  {
    label: "Recording",
    value: "Last 60 s",
    anchor: { x: 86, y: 93 },
    callout: "below",
  },
];

// Request ticks on the timeline, as percentages of the frame width. One sits
// under the Network anchor.
const REQUEST_TICKS = [12, 14, 18, 23, 27, 32, 38, 43, 47, 55, 61, 66, 72, 79];

function toCanvas({ x, y }: Point) {
  return {
    x: FRAME_LEFT + (x * FRAME_WIDTH) / 100,
    y: FRAME_TOP + (y * FRAME_HEIGHT) / 100,
  };
}

function leaderPath({ anchor, callout }: Field) {
  const start = toCanvas(anchor);
  return callout === "right"
    ? `M${start.x} ${start.y} H${CALLOUT_RIGHT_X}`
    : `M${start.x} ${start.y} V${CALLOUT_BELOW_Y}`;
}

export function ReportAnatomyIllustration() {
  return (
    <div role="img" aria-label={ARIA_LABEL} className="@container w-full">
      <div className="relative @min-[30rem]:aspect-[4/3]">
        <div className="relative mx-1.5 aspect-[4/3] @min-[30rem]:absolute @min-[30rem]:top-[13.333%] @min-[30rem]:left-0 @min-[30rem]:mx-0 @min-[30rem]:w-[60%]">
          <PricingScreenshot />
          {FIELDS.map((field, i) => (
            <FieldAnchor key={field.label} field={field} index={i} />
          ))}
        </div>

        <svg
          viewBox={`0 0 100 ${CANVAS_HEIGHT}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 hidden size-full @min-[30rem]:block"
          aria-hidden
        >
          {FIELDS.map((field) => (
            <path
              key={field.label}
              d={leaderPath(field)}
              fill="none"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="stroke-indigo-400/60"
            />
          ))}
        </svg>

        {FIELDS.map((field) => (
          <FieldCallout key={field.label} field={field} />
        ))}
      </div>

      <FieldList />
    </div>
  );
}

type FieldProps = {
  field: Field;
};

type IndexedFieldProps = FieldProps & {
  index: number;
};

// Side by side, a dot where the leader line leaves the frame. Stacked, a
// numbered badge that the list below refers to.
function FieldAnchor({ field, index }: IndexedFieldProps) {
  return (
    <span
      className={`absolute z-10 flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[8px] font-semibold text-zinc-950 ring-2 ring-zinc-950 @min-[30rem]:size-1.5 ${field.tone === "error" ? "bg-red-400" : "bg-indigo-400"}`}
      style={{ left: `${field.anchor.x}%`, top: `${field.anchor.y}%` }}
    >
      <span className="@min-[30rem]:hidden">{index + 1}</span>
    </span>
  );
}

function FieldCallout({ field }: FieldProps) {
  const anchor = toCanvas(field.anchor);
  const position =
    field.callout === "right"
      ? {
          left: `${CALLOUT_RIGHT_X}%`,
          top: `${(anchor.y / CANVAS_HEIGHT) * 100}%`,
        }
      : {
          left: `${anchor.x}%`,
          top: `${(CALLOUT_BELOW_Y / CANVAS_HEIGHT) * 100}%`,
        };

  return (
    <div
      className={`absolute hidden flex-col rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono whitespace-nowrap @min-[30rem]:flex ${field.callout === "right" ? "-translate-y-1/2" : "-translate-x-3"}`}
      style={position}
    >
      <span className="text-[10px] leading-3 text-zinc-500">{field.label}</span>
      <span className={`text-[11px] leading-4 ${valueColor(field)}`}>
        {field.value}
      </span>
    </div>
  );
}

function valueColor({ tone }: Field) {
  return tone === "error" ? "text-red-400" : "text-zinc-300";
}

function FieldList() {
  return (
    <div className="mx-1.5 mt-3 flex flex-col gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-3 @min-[30rem]:hidden">
      {FIELDS.map((field, i) => (
        <div
          key={field.label}
          className="flex items-start gap-2 font-mono leading-4"
        >
          <span
            className={`mt-px flex size-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-zinc-950 ${field.tone === "error" ? "bg-red-400" : "bg-indigo-400"}`}
          >
            {i + 1}
          </span>
          <span className="w-16 shrink-0 text-[10px] text-zinc-500">
            {field.label}
          </span>
          <span className={`min-w-0 text-[10px] ${valueColor(field)}`}>
            {field.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PricingScreenshot() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      {/* Browser chrome */}
      <div className="absolute inset-x-0 top-0 h-[11%] border-b border-zinc-800 bg-zinc-900" />
      <div className="absolute top-[5.5%] left-[4%] flex -translate-y-1/2 gap-1">
        <span className="size-1.5 rounded-full bg-zinc-700" />
        <span className="size-1.5 rounded-full bg-zinc-700" />
        <span className="size-1.5 rounded-full bg-zinc-700" />
      </div>
      <div className="absolute top-[5.5%] left-[14%] flex h-[6.5%] w-[50%] -translate-y-1/2 items-center rounded-full bg-zinc-800 px-2">
        <span className="truncate font-mono text-[9px] text-zinc-400">
          yourapp.com/pricing
        </span>
      </div>

      {/* Navigation */}
      <span className="absolute top-[15%] left-[8%] h-[2.5%] w-[10%] -translate-y-1/2 rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[15%] left-[66%] h-[2%] w-[8%] -translate-y-1/2 rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[15%] left-[78%] h-[2%] w-[14%] -translate-y-1/2 rounded-[2px] bg-zinc-800" />
      <span className="absolute inset-x-0 top-[19%] h-px bg-zinc-800/80" />

      {/* Heading */}
      <span className="absolute top-[23%] left-[34%] h-[3.5%] w-[32%] rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[28.5%] left-[40%] h-[2%] w-[20%] rounded-[2px] bg-zinc-800" />

      <PlanCard left={8} />
      <PlanCard left={38} featured />
      <PlanCard left={68} />

      {/* Selection frame around the clicked card */}
      <div className="absolute top-[33%] left-[36%] h-[50%] w-[28%] rounded-lg border-2 border-dashed border-indigo-400/90 bg-indigo-400/10" />
      <span className="absolute top-[67%] left-[50%] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-400/80" />

      <RecordingTimeline />
    </div>
  );
}

type PlanCardProps = {
  left: number;
  featured?: boolean;
};

function PlanCard({ left, featured = false }: PlanCardProps) {
  return (
    <div
      className="absolute top-[36%] h-[44%] w-[24%] rounded-md border border-zinc-800 bg-zinc-900/70"
      style={{ left: `${left}%` }}
    >
      <span className="absolute top-[10%] left-[12%] h-[6%] w-[40%] rounded-[2px] bg-zinc-700" />
      <span className="absolute top-[22%] left-[12%] h-[11%] w-[55%] rounded-[2px] bg-zinc-600" />
      <span className="absolute top-[43%] left-[12%] h-[4%] w-[72%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[52%] left-[12%] h-[4%] w-[60%] rounded-[2px] bg-zinc-800" />
      <span className="absolute top-[61%] left-[12%] h-[4%] w-[66%] rounded-[2px] bg-zinc-800" />
      <span
        className={`absolute inset-x-[12%] top-[78%] h-[12%] rounded-[3px] ${featured ? "bg-zinc-200" : "bg-zinc-800"}`}
      />
    </div>
  );
}

// The strip's vertical centre, 93%, is the y of the three anchors below it.
function RecordingTimeline() {
  return (
    <>
      <div className="absolute inset-x-0 top-[86%] bottom-0 border-t border-zinc-800 bg-zinc-900" />
      <PlayIcon className="absolute top-[93%] left-[5%] size-2.5 -translate-x-1/2 -translate-y-1/2 fill-zinc-400 text-zinc-400" />
      <span className="absolute top-[93%] right-[14%] left-[10%] h-0.5 -translate-y-1/2 rounded-full bg-zinc-800" />
      {REQUEST_TICKS.map((x) => (
        <span
          key={x}
          className="absolute top-[93%] h-[4%] w-px -translate-x-1/2 -translate-y-1/2 bg-zinc-500"
          style={{ left: `${x}%` }}
        />
      ))}
      <span className="absolute top-[93%] left-[86%] h-[7%] w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
    </>
  );
}
