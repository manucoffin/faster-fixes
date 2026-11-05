import { cn } from "@workspace/ui/lib/utils";
import type { SelectionGeometry } from "../_helpers/map-selection-to-box";

type SelectionMarkerProps = {
  geometry: SelectionGeometry;
  className?: string;
};

function percent(fraction: number) {
  return `${fraction * 100}%`;
}

// A point or an area drawn over a frame, positioned in its box's coordinates.
export function SelectionMarker({ geometry, className }: SelectionMarkerProps) {
  if (geometry.kind === "area") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute rounded-sm border-2 border-primary bg-primary/15 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
          className,
        )}
        style={{
          left: percent(geometry.left),
          top: percent(geometry.top),
          width: percent(geometry.width),
          height: percent(geometry.height),
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
        className,
      )}
      style={{ left: percent(geometry.left), top: percent(geometry.top) }}
    />
  );
}
