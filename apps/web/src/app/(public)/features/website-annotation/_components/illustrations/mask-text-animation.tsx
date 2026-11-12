import { UserIcon } from "lucide-react";

const CYCLE = 9;

// Seconds between two characters of the same line flipping.
const CHAR_STAGGER = 0.04;

// Percentages of the cycle: each line flips to asterisks at `mask`, holds,
// then flips back at `unmask`. A flip lasts FLIP.
const FLIP = 3;
const LINES = [
  {
    text: "Claire Martin",
    className: "text-xs font-medium text-zinc-100 @sm:text-sm",
    mask: 8,
    unmask: 72,
  },
  {
    text: "14 rue des Lilas",
    className: "text-[11px] text-zinc-400 @sm:text-xs",
    mask: 22,
    unmask: 77,
  },
  {
    text: "69003 Lyon",
    className: "text-[11px] text-zinc-400 @sm:text-xs",
    mask: 36,
    unmask: 82,
  },
] as const;

const ARIA_LABEL =
  "Animation showing a customer card in a Recording whose name and address turn to asterisks line by line, while the card keeps its exact size and position.";

function lineKeyframes() {
  return LINES.map(
    ({ mask, unmask }, i) => `@keyframes wa-mask-text-${i} {
  0%, ${mask}% { opacity: 1; transform: translateY(0); }
  ${mask + FLIP}%, ${unmask}% { opacity: 0; transform: translateY(-45%); }
  ${unmask + FLIP}%, 100% { opacity: 1; transform: translateY(0); }
}
@keyframes wa-mask-star-${i} {
  0%, ${mask}% { opacity: 0; transform: translateY(45%); }
  ${mask + FLIP}%, ${unmask}% { opacity: 1; transform: translateY(0); }
  ${unmask + FLIP}%, 100% { opacity: 0; transform: translateY(45%); }
}
.wa-mask-text-${i} { animation: wa-mask-text-${i} ${CYCLE}s ease-in-out infinite both; }
.wa-mask-star-${i} { opacity: 0; animation: wa-mask-star-${i} ${CYCLE}s ease-in-out infinite both; }`,
  ).join("\n");
}

const styles = `
${lineKeyframes()}

@media (prefers-reduced-motion: reduce) {
  ${LINES.map((_, i) => `.wa-mask-text-${i}`).join(", ")} { animation: none; opacity: 0; }
  ${LINES.map((_, i) => `.wa-mask-star-${i}`).join(", ")} { animation: none; opacity: 1; transform: none; }
}
`;

export function MaskTextAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="@container flex aspect-[16/9] w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex items-center gap-1.5 border-b border-zinc-800/80 px-3 py-2 font-mono text-[10px] text-zinc-400">
        <span className="size-1.5 rounded-full bg-red-400" />
        Recording
        <span className="ml-auto text-zinc-500">yourapp.com/account</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-950 px-4">
        <div className="h-1.5 w-[42%] rounded-[2px] bg-zinc-800" />

        <div className="flex flex-col items-end gap-1">
          <div className="rounded-md border border-dashed border-indigo-400/40 p-1.5">
            <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 @sm:gap-4 @sm:px-4 @sm:py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 @sm:size-10">
                <UserIcon className="size-4 text-zinc-500 @sm:size-5" />
              </span>
              <div className="flex flex-col gap-0.5 font-mono leading-snug">
                {LINES.map((line, i) => (
                  <MaskedLine
                    key={line.text}
                    line={i}
                    text={line.text}
                    className={line.className}
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="font-mono text-[9px] text-indigo-300/70">
            248 × 76
          </span>
        </div>

        <div className="h-1.5 w-[30%] rounded-[2px] bg-zinc-800/60" />
      </div>
    </div>
  );
}

type MaskedLineProps = {
  line: number;
  text: string;
  className: string;
};

// Each character and its asterisk share one grid cell, so the line keeps its
// width whichever is visible. Whitespace is never masked.
function MaskedLine({ line, text, className }: MaskedLineProps) {
  return (
    <span className={`block whitespace-pre ${className}`}>
      {Array.from(text).map((char, j) => {
        const delay = { animationDelay: `${j * CHAR_STAGGER}s` };
        return char === " " ? (
          " "
        ) : (
          <span key={j} className="inline-grid">
            <span
              className={`wa-mask-text-${line} [grid-area:1/1]`}
              style={delay}
            >
              {char}
            </span>
            <span
              className={`wa-mask-star-${line} [grid-area:1/1]`}
              style={delay}
            >
              *
            </span>
          </span>
        );
      })}
    </span>
  );
}
