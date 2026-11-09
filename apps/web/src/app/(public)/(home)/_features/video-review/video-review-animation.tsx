import { PlayIcon } from "lucide-react";
import { TerminalFrame } from "../how-it-works/flow-animations";

const CYCLE = 9;

// Positions are percentages of the frame (areas) or of the timeline (markers),
// and the keyframe windows below line up with the marker positions: the
// playhead crosses each marker as its Feedback appears.
const FEEDBACK = [
  {
    reviewer: "Sarah",
    time: "0:12",
    message: "Logo shows up too late",
    area: { x: 8, y: 14, width: 22, height: 24 },
    card: { x: 34, y: 12 },
    marker: { start: 30, end: null },
    animation: "vra-feedback-1",
  },
  {
    reviewer: "Tom",
    time: "0:23 – 0:29",
    message: "Price should read $49",
    area: { x: 40, y: 56, width: 34, height: 18 },
    card: { x: 8, y: 56 },
    marker: { start: 58, end: 74 },
    animation: "vra-feedback-2",
  },
] as const;

const ARIA_LABEL =
  "Animation showing a video playing while client feedback appears at exact moments, each pointing at an area of the frame and marked on the timeline.";

const styles = `
@keyframes vra-playhead {
  0% { left: 0%; }
  100% { left: 100%; }
}

@keyframes vra-feedback-1 {
  0%, 29% { opacity: 0; transform: translateY(4px); }
  32%, 52% { opacity: 1; transform: translateY(0); }
  56%, 100% { opacity: 0; transform: translateY(4px); }
}

@keyframes vra-feedback-2 {
  0%, 57% { opacity: 0; transform: translateY(4px); }
  60%, 80% { opacity: 1; transform: translateY(0); }
  84%, 100% { opacity: 0; transform: translateY(4px); }
}

.vra-playhead { animation: vra-playhead ${CYCLE}s linear infinite; }
.vra-feedback-1 { opacity: 0; animation: vra-feedback-1 ${CYCLE}s ease-in-out infinite; }
.vra-feedback-2 { opacity: 0; animation: vra-feedback-2 ${CYCLE}s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .vra-playhead { animation: none; left: 66%; }
  .vra-feedback-1 { animation: none; opacity: 0; }
  .vra-feedback-2 { animation: none; opacity: 1; }
}
`;

export function VideoReviewAnimation() {
  return (
    <div role="img" aria-label={ARIA_LABEL}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <TerminalFrame
        title="product-launch.mp4"
        contentClassName="flex flex-col gap-3 p-3"
      >
        <VideoFrame />
        <PlayerControls />
      </TerminalFrame>
    </div>
  );
}

function VideoFrame() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950/60">
      <div className="absolute top-[18%] left-[10%] size-[16%] rounded-md bg-zinc-700/80" />
      <div className="absolute top-[44%] left-[10%] h-[7%] w-[50%] rounded-[3px] bg-zinc-700/70" />
      <div className="absolute top-[58%] left-[44%] h-[10%] w-[26%] rounded-[3px] bg-zinc-700/80" />
      <div className="absolute top-[78%] left-[10%] h-[4%] w-[36%] rounded-[2px] bg-zinc-800" />

      {FEEDBACK.map((feedback) => (
        <div
          key={feedback.reviewer}
          className={`absolute inset-0 ${feedback.animation}`}
        >
          <div
            className="absolute rounded-md border-2 border-dashed border-indigo-400/80 bg-indigo-400/10"
            style={{
              left: `${feedback.area.x}%`,
              top: `${feedback.area.y}%`,
              width: `${feedback.area.width}%`,
              height: `${feedback.area.height}%`,
            }}
          />
          <div
            className="absolute max-w-[60%] rounded-md border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 shadow-lg"
            style={{ left: `${feedback.card.x}%`, top: `${feedback.card.y}%` }}
          >
            <p className="font-mono text-[10px] text-zinc-500">
              {feedback.reviewer} · {feedback.time}
            </p>
            <p className="text-xs text-zinc-200">{feedback.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerControls() {
  return (
    <div className="flex items-center gap-3 px-1">
      <PlayIcon className="size-3.5 shrink-0 fill-zinc-400 text-zinc-400" />
      <div className="relative h-1 flex-1 rounded-full bg-zinc-800">
        {FEEDBACK.map(({ reviewer, marker }) =>
          marker.end === null ? (
            <span
              key={reviewer}
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400"
              style={{ left: `${marker.start}%` }}
            />
          ) : (
            <span
              key={reviewer}
              className="absolute inset-y-0 rounded-full bg-indigo-400/70"
              style={{
                left: `${marker.start}%`,
                width: `${marker.end - marker.start}%`,
              }}
            />
          ),
        )}
        <span className="vra-playhead absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
      </div>
      <span className="shrink-0 font-mono text-[10px] text-zinc-500">0:40</span>
    </div>
  );
}
