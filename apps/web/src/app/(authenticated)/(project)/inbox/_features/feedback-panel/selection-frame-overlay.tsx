import type { SelectionFrame } from "../../_helpers/selection-frame";

type SelectionFrameOverlayProps = {
  frame: SelectionFrame;
};

// Drawn over the Screenshot rather than into it, so the stored image stays a faithful capture.
export function SelectionFrameOverlay({ frame }: SelectionFrameOverlayProps) {
  const { element, click } = frame;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute rounded-[2px] border-2 border-primary ring-1 ring-background"
        style={{
          left: `${element.left}%`,
          top: `${element.top}%`,
          width: `${element.width}%`,
          height: `${element.height}%`,
        }}
      />
      <div
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
        style={{ left: `${click.x}%`, top: `${click.y}%` }}
      />
    </div>
  );
}
