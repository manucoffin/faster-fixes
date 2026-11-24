import type { SelectionFrame } from "../../_helpers/selection-frame";

type SelectionFrameOverlayProps = {
  frame: SelectionFrame;
};

// Drawn over the Screenshot rather than into it, so the stored image stays a faithful capture.
export function SelectionFrameOverlay({ frame }: SelectionFrameOverlayProps) {
  // An area Selection is the rectangle alone, with no click point.
  const rect = "area" in frame ? frame.area : frame.element;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute rounded-[2px] border-2 border-primary ring-1 ring-background"
        style={{
          left: `${rect.left}%`,
          top: `${rect.top}%`,
          width: `${rect.width}%`,
          height: `${rect.height}%`,
        }}
      />
      {"click" in frame && (
        <div
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
          style={{ left: `${frame.click.x}%`, top: `${frame.click.y}%` }}
        />
      )}
    </div>
  );
}
