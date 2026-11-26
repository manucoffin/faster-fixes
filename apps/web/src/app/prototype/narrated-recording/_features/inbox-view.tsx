// PROTOTYPE, throwaway. How a narrated Recording is told apart from an
// automatic one on a board card and in the feedback panel: three treatments
// side by side, each next to today's automatic Recording for contrast.
import { cn } from "@workspace/ui/lib/utils";
import { Mic, Play, PlayCircle } from "lucide-react";
import { DURATION_MS, VOICE } from "./data";

const FIRST_LINE = VOICE[0]?.text ?? "";

export function InboxView() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto grid max-w-[90rem] grid-cols-[6rem_repeat(4,minmax(0,1fr))] gap-x-5 gap-y-8 text-sm">
        <span />
        <ColumnTitle title="Today" note="Automatic Recording, for contrast." />
        <ColumnTitle
          title="1. Label"
          note="Fallback label as the title, a voice chip."
        />
        <ColumnTitle
          title="2. Transcript as the comment"
          note="The first words said stand in for the note."
        />
        <ColumnTitle
          title="3. Voice strip"
          note="When the Reviewer speaks, drawn on the card. Plays in the panel."
        />

        <RowTitle>Board card</RowTitle>
        <Card title="The total does not update when I change the quantity." />
        <Card title="Narrated recording, 1 min 48 s" isFallback>
          <VoiceChip />
        </Card>
        <Card title={`“${FIRST_LINE}”`}>
          <VoiceChip />
        </Card>
        <Card title="Narrated recording" isFallback>
          <VoiceBand />
        </Card>

        <RowTitle>Feedback panel</RowTitle>
        <PanelRow icon={<PlayCircle />} label="Play recording" time="0:31" />
        <PanelRow icon={<Mic />} label="Play narrated recording" time="1:48" />
        <div className="flex flex-col gap-2">
          <PanelRow
            icon={<Mic />}
            label="Play narrated recording"
            time="1:48"
          />
          <p className="line-clamp-4 border-l pl-3 text-muted-foreground">
            {VOICE.slice(0, 3)
              .map((line) => line.text)
              .join(" ")}
          </p>
          <span className="text-xs font-medium underline underline-offset-2">
            Read the transcript
          </span>
        </div>
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Play className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <VoiceBand />
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              1:48
            </span>
          </div>
          <p className="text-muted-foreground">{FIRST_LINE}</p>
          <span className="text-xs font-medium underline underline-offset-2">
            Open the replay
          </span>
        </div>
      </div>
    </div>
  );
}

type ColumnTitleProps = { title: string; note: string };

function ColumnTitle({ title, note }: ColumnTitleProps) {
  return (
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

type RowTitleProps = { children: React.ReactNode };

function RowTitle({ children }: RowTitleProps) {
  return <span className="pt-2 text-xs text-muted-foreground">{children}</span>;
}

type CardProps = {
  title: string;
  isFallback?: boolean;
  children?: React.ReactNode;
};

function Card({ title, isFallback, children }: CardProps) {
  return (
    <div className="flex h-fit flex-col gap-2 rounded-lg border bg-card p-3">
      <p
        className={cn(
          "line-clamp-3 leading-snug",
          isFallback && "text-muted-foreground",
        )}
      >
        {title}
      </p>
      {children}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">/cart</span>
        <span className="ml-auto">Camille Roy</span>
        <span className="flex size-5 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-semibold text-violet-700 dark:text-violet-300">
          CR
        </span>
      </div>
    </div>
  );
}

function VoiceChip() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded border bg-background px-1.5 py-px text-[11px] font-medium text-muted-foreground">
      <Mic className="size-3" />
      <span className="font-mono tabular-nums">1:48</span>
    </span>
  );
}

// Real data, not decoration: one mark per sentence, placed on the clock.
function VoiceBand() {
  return (
    <span className="relative block h-3 w-full min-w-0 shrink-0 rounded-sm bg-muted">
      {VOICE.map((line) => (
        <span
          key={line.start}
          className="absolute inset-y-0.5 rounded-sm bg-foreground/60"
          style={{
            left: `${String((line.start / DURATION_MS) * 100)}%`,
            width: `${String(((line.end - line.start) / DURATION_MS) * 100)}%`,
          }}
        />
      ))}
    </span>
  );
}

type PanelRowProps = { icon: React.ReactNode; label: string; time: string };

function PanelRow({ icon, label, time }: PanelRowProps) {
  return (
    <div className="flex h-fit items-center gap-3 rounded-md border px-3 py-2.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
      {icon}
      <span className="font-medium whitespace-nowrap">{label}</span>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {time}
      </span>
      <span className="ml-auto text-xs whitespace-nowrap text-destructive">
        3 errors
      </span>
    </div>
  );
}
