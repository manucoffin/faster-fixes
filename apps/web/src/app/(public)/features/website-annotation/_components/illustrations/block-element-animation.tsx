import { CameraIcon } from "lucide-react";

const CYCLE = 8;

// Percentages of the cycle: the statement fades out between BLOCK_START and
// BLOCKED, holds, then comes back between RESTORE_START and RESTORED.
const BLOCK_START = 22;
const BLOCKED = 30;
const RESTORE_START = 80;
const RESTORED = 88;

// The statement and its placeholder share this box, as percentages of the
// mock page, so the footprint matches the element exactly.
const STATEMENT = { x: 52, y: 20, width: 40, height: 68 };

// The element's rendered size, kept by its placeholder.
const FOOTPRINT_SIZE = "320 × 184";

const STATEMENT_ROWS = [
  { label: "w-[46%]", amount: "1,240.00" },
  { label: "w-[34%]", amount: "−86.40" },
  { label: "w-[40%]", amount: "−312.00" },
] as const;

const OUTPUTS = ["Recording", "Screenshot"] as const;

type Output = (typeof OUTPUTS)[number];

const ARIA_LABEL =
  "Animation showing a bank statement on a page fading out of the Recording and the Screenshot, leaving an empty frame of the same size while the rest of the layout stays in place.";

const styles = `
@keyframes wa-block-off {
  0%, ${BLOCK_START}% { opacity: 1; }
  ${BLOCKED}%, ${RESTORE_START}% { opacity: 0; }
  ${RESTORED}%, 100% { opacity: 1; }
}

@keyframes wa-block-on {
  0%, ${BLOCK_START}% { opacity: 0; }
  ${BLOCKED}%, ${RESTORE_START}% { opacity: 1; }
  ${RESTORED}%, 100% { opacity: 0; }
}

.wa-block-element { animation: wa-block-off ${CYCLE}s ease-in-out infinite; }
.wa-block-footprint, .wa-block-lit { opacity: 0; animation: wa-block-on ${CYCLE}s ease-in-out infinite; }

.wa-block-hatch {
  background-image: repeating-linear-gradient(135deg, rgb(113 113 122 / 0.14) 0 1px, transparent 1px 7px);
}

@media (prefers-reduced-motion: reduce) {
  .wa-block-element { animation: none; opacity: 0; }
  .wa-block-footprint, .wa-block-lit { animation: none; opacity: 1; }
}
`;

export function BlockElementAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="flex aspect-[16/9] w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex items-center gap-3 border-b border-zinc-800/80 px-3 py-2 font-mono text-[10px]">
        {OUTPUTS.map((output) => (
          <OutputLabel key={output} output={output} />
        ))}
        <span className="ml-auto min-w-0 truncate text-zinc-500">
          yourapp.com/statements
        </span>
      </div>

      <MockPage />
    </div>
  );
}

function MockPage() {
  const box = {
    left: `${STATEMENT.x}%`,
    top: `${STATEMENT.y}%`,
    width: `${STATEMENT.width}%`,
    height: `${STATEMENT.height}%`,
  };

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-zinc-950">
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 flex h-[14%] items-center gap-[4%] border-b border-zinc-800 px-[6%]">
        <span className="h-[30%] w-[12%] rounded-[2px] bg-zinc-700" />
        <span className="ml-auto h-[22%] w-[9%] rounded-[2px] bg-zinc-800" />
        <span className="h-[22%] w-[9%] rounded-[2px] bg-zinc-800" />
      </div>

      {/* Account summary */}
      <div className="absolute top-[24%] left-[8%] h-[8%] w-[32%] rounded-[2px] bg-zinc-700" />
      <div className="absolute top-[40%] left-[8%] h-[4%] w-[36%] rounded-[2px] bg-zinc-800" />
      <div className="absolute top-[49%] left-[8%] h-[4%] w-[30%] rounded-[2px] bg-zinc-800" />
      <div className="absolute top-[58%] left-[8%] h-[4%] w-[34%] rounded-[2px] bg-zinc-800" />
      <div className="absolute top-[72%] left-[8%] h-[12%] w-[20%] rounded-[4px] bg-zinc-800" />

      <div
        className="wa-block-footprint wa-block-hatch absolute flex items-center justify-center rounded-[4px] border border-dashed border-zinc-600"
        style={box}
      >
        <span className="font-mono text-[9px] text-indigo-300/70">
          {FOOTPRINT_SIZE}
        </span>
      </div>

      <div
        className="wa-block-element absolute flex flex-col justify-between rounded-[4px] bg-zinc-100 px-[4%] py-[3.5%]"
        style={box}
      >
        <div className="flex items-center justify-between">
          <span className="h-1.5 w-[38%] rounded-[1px] bg-zinc-800" />
          <span className="h-1 w-[22%] rounded-[1px] bg-zinc-300" />
        </div>
        {STATEMENT_ROWS.map(({ label, amount }) => (
          <div key={amount} className="flex items-center justify-between">
            <span className={`h-1 rounded-[1px] bg-zinc-300 ${label}`} />
            <span className="font-mono text-[8px] leading-none text-zinc-600 tabular-nums">
              {amount}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-zinc-300 pt-[3%]">
          <span className="h-1 w-[24%] rounded-[1px] bg-zinc-500" />
          <span className="font-mono text-[8px] leading-none font-semibold text-zinc-900 tabular-nums">
            841.60
          </span>
        </div>
      </div>
    </div>
  );
}

type OutputLabelProps = {
  output: Output;
};

// A dim face, with a lit face fading in on top while the element is blocked.
function OutputLabel({ output }: OutputLabelProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <LabelFace output={output} lit={false} />
      <span className="wa-block-lit absolute inset-0 flex bg-zinc-900">
        <LabelFace output={output} lit />
      </span>
    </span>
  );
}

type LabelFaceProps = {
  output: Output;
  lit: boolean;
};

function LabelFace({ output, lit }: LabelFaceProps) {
  return (
    <span
      className={`flex items-center gap-1.5 ${lit ? "text-zinc-200" : "text-zinc-500"}`}
    >
      {output === "Recording" ? (
        <span
          className={`size-1.5 rounded-full ${lit ? "bg-red-400" : "bg-red-400/40"}`}
        />
      ) : (
        <CameraIcon
          className={`size-2.5 ${lit ? "text-zinc-300" : "text-zinc-600"}`}
        />
      )}
      {output}
    </span>
  );
}
