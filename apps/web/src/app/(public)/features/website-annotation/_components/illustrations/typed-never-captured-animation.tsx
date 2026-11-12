import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 8;

const CARD_NUMBER = "4242 4242 4242 4242";

// Percentages of the cycle. The field takes focus at FOCUS, then one character
// lands every CHAR_STEP from TYPE_START; the form clears between FADE and 100.
const FOCUS = 6;
const TYPE_START = 10;
const CHAR_STEP = 3;
const TYPE_END = TYPE_START + CARD_NUMBER.length * CHAR_STEP;
const FADE = 90;
const BLINK = 3;

const ARIA_LABEL =
  "Animation showing the same checkout form twice. On the live page a card number is typed digit by digit. In its Recording the caret moves in step and the field fills with neutral dots: the digits never appear.";

// One stop per character, with step-end timing, so the field widens one
// character at a time instead of sliding.
function revealKeyframes() {
  const stops = Array.from(
    { length: CARD_NUMBER.length },
    (_, i) => `${TYPE_START + (i + 1) * CHAR_STEP}% { width: ${i + 1}ch; }`,
  ).join("\n  ");
  return `@keyframes wa-typed-reveal {
  0% { width: 0ch; }
  ${stops}
  100% { width: 0ch; }
}`;
}

// The caret holds steady while typing and blinks once the field is idle.
function caretKeyframes() {
  const blinks: string[] = [];
  for (
    let at = TYPE_END + BLINK, on = false;
    at < FADE;
    at += BLINK, on = !on
  ) {
    blinks.push(`${at}% { opacity: ${on ? 1 : 0}; }`);
  }
  return `@keyframes wa-typed-caret {
  0% { opacity: 0; }
  ${FOCUS}% { opacity: 1; }
  ${blinks.join("\n  ")}
  ${FADE}%, 100% { opacity: 0; }
}`;
}

const styles = `
${revealKeyframes()}
${caretKeyframes()}

@keyframes wa-typed-focus {
  0%, ${FOCUS - 2}% { opacity: 0; }
  ${FOCUS}%, ${FADE}% { opacity: 1; }
  ${FADE + 4}%, 100% { opacity: 0; }
}

@keyframes wa-typed-value {
  0%, ${FADE}% { opacity: 1; }
  ${FADE + 4}%, 100% { opacity: 0; }
}

@keyframes wa-typed-playhead {
  0% { left: 0%; }
  100% { left: 100%; }
}

.wa-typed-reveal { width: 0ch; animation: wa-typed-reveal ${CYCLE}s step-end infinite; }
.wa-typed-caret { opacity: 0; animation: wa-typed-caret ${CYCLE}s step-end infinite; }
.wa-typed-focus { opacity: 0; animation: wa-typed-focus ${CYCLE}s ease-out infinite; }
.wa-typed-value { animation: wa-typed-value ${CYCLE}s ease-out infinite; }
.wa-typed-playhead { animation: wa-typed-playhead ${CYCLE}s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .wa-typed-reveal { animation: none; width: ${CARD_NUMBER.length}ch; }
  .wa-typed-caret { animation: none; opacity: 1; }
  .wa-typed-focus { animation: none; opacity: 1; }
  .wa-typed-value { animation: none; opacity: 1; }
  .wa-typed-playhead { animation: none; left: ${TYPE_END}%; }
}
`;

export function TypedNeverCapturedAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Pane label="Live page" recording={false} />
      <Pane label="Recording" recording />
    </div>
  );
}

type PaneProps = {
  label: string;
  recording: boolean;
};

function Pane({ label, recording }: PaneProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        {recording ? (
          <span className="size-1.5 rounded-full bg-red-400" />
        ) : null}
        {label}
      </span>
      <TerminalFrame
        title="yourapp.com/checkout"
        contentClassName="flex flex-col gap-3 p-3"
      >
        <CheckoutForm recording={recording} />
        {recording ? (
          <RecordingTimeline />
        ) : (
          // Keeps both panes the same height.
          <div className="h-3" />
        )}
      </TerminalFrame>
    </div>
  );
}

type CheckoutFormProps = {
  recording: boolean;
};

function CheckoutForm({ recording }: CheckoutFormProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-md bg-zinc-950 p-3">
      <div className="flex flex-col gap-1.5">
        <span className="h-2 w-[45%] rounded-[2px] bg-zinc-700" />
        <span className="h-1.5 w-[70%] rounded-[2px] bg-zinc-800" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] text-zinc-500">Card number</span>
        <div className="relative flex h-7 items-center rounded-[4px] border border-zinc-700 bg-zinc-900 px-2 font-mono text-[11px] text-zinc-200">
          <span className="wa-typed-focus absolute -inset-px rounded-[4px] border border-indigo-400/80" />
          <span className="wa-typed-value flex items-center">
            <span className="wa-typed-reveal flex shrink-0 overflow-hidden">
              {Array.from(CARD_NUMBER, (char, i) => (
                <Character key={i} char={char} masked={recording} />
              ))}
            </span>
            <span className="wa-typed-caret ml-px h-3 w-px bg-zinc-200" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <EmptyField label="Expiry" />
        <EmptyField label="CVC" />
      </div>

      <div className="flex h-7 items-center justify-center rounded-[4px] bg-zinc-200">
        <span className="text-[10px] font-semibold text-zinc-900">Pay $49</span>
      </div>
    </div>
  );
}

type CharacterProps = {
  char: string;
  masked: boolean;
};

// Every character takes exactly 1ch, digit or dot, so both panes advance in step.
function Character({ char, masked }: CharacterProps) {
  if (!masked || char === " ") {
    return <span className="w-[1ch] shrink-0 text-center">{char}</span>;
  }
  return (
    <span className="flex w-[1ch] shrink-0 items-center justify-center">
      <span className="size-[5px] rounded-full bg-zinc-400" />
    </span>
  );
}

type EmptyFieldProps = {
  label: string;
};

function EmptyField({ label }: EmptyFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] text-zinc-500">{label}</span>
      <div className="h-7 rounded-[4px] border border-zinc-800 bg-zinc-900" />
    </div>
  );
}

function RecordingTimeline() {
  return (
    <div className="flex h-3 items-center px-1">
      <div className="relative h-1 flex-1 rounded-full bg-zinc-800">
        <span className="wa-typed-playhead absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}
