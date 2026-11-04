"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useState, type PointerEvent, type ReactNode } from "react";
import type { FrameArea, FramePoint, VideoSelection } from "./use-video-review";

export type FramePin = {
  id: string;
  label: string;
  selection: VideoSelection;
  active: boolean;
};

type FrameOverlayProps = {
  draft: VideoSelection | null;
  disabled?: boolean;
  /** Existing Feedback drawn on the frame, for the variants that pin them. */
  pins?: FramePin[];
  onPoint: (point: FramePoint) => void;
  onArea: (area: FrameArea) => void;
  onPinClick?: (id: string) => void;
  /** A plain tap with no draft marker placed, for play/pause toggles. */
  onTap?: () => boolean;
  children?: ReactNode;
};

type Drag = { start: FramePoint; current: FramePoint };

const DRAG_THRESHOLD = 0.015;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function toPoint(event: PointerEvent<HTMLDivElement>): FramePoint {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}

function toArea(drag: Drag): FrameArea {
  const x = Math.min(drag.start.x, drag.current.x);
  const y = Math.min(drag.start.y, drag.current.y);
  return {
    x,
    y,
    width: Math.abs(drag.current.x - drag.start.x),
    height: Math.abs(drag.current.y - drag.start.y),
  };
}

function percent(value: number) {
  return `${value * 100}%`;
}

type SelectionMarkerProps = {
  selection: Pick<VideoSelection, "point" | "area">;
  className?: string;
};

export function SelectionMarker({
  selection,
  className,
}: SelectionMarkerProps) {
  if (selection.area) {
    return (
      <div
        className={cn(
          "absolute rounded-sm border-2 border-primary bg-primary/15 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
          className,
        )}
        style={{
          left: percent(selection.area.x),
          top: percent(selection.area.y),
          width: percent(selection.area.width),
          height: percent(selection.area.height),
        }}
      />
    );
  }
  if (selection.point) {
    return (
      <div
        className={cn(
          "absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
          className,
        )}
        style={{
          left: percent(selection.point.x),
          top: percent(selection.point.y),
        }}
      />
    );
  }
  return null;
}

// Sits exactly over the rendered frame: a click places a point, a drag
// outlines an area, both normalized to the frame so they survive resizing.
export function FrameOverlay({
  draft,
  disabled = false,
  pins = [],
  onPoint,
  onArea,
  onPinClick,
  onTap,
  children,
}: FrameOverlayProps) {
  const [drag, setDrag] = useState<Drag | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toPoint(event);
    setDrag({ start: point, current: point });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setDrag({ start: drag.start, current: toPoint(event) });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const end = toPoint(event);
    const distance = Math.hypot(end.x - drag.start.x, end.y - drag.start.y);
    setDrag(null);
    if (distance < DRAG_THRESHOLD) {
      // The host may swallow the tap, for instance to pause a playing video.
      if (onTap?.()) return;
      onPoint(drag.start);
      return;
    }
    onArea(toArea({ start: drag.start, current: end }));
  }

  const dragArea =
    drag !== null &&
    Math.hypot(drag.current.x - drag.start.x, drag.current.y - drag.start.y) >=
      DRAG_THRESHOLD
      ? toArea(drag)
      : null;

  return (
    <div
      className={cn(
        "absolute inset-0 touch-none select-none",
        disabled ? "cursor-default" : "cursor-crosshair",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      {pins.map((pin) => (
        <PinMarker
          key={pin.id}
          pin={pin}
          onClick={() => onPinClick?.(pin.id)}
        />
      ))}
      {draft ? <SelectionMarker selection={draft} /> : null}
      {dragArea ? (
        <SelectionMarker
          selection={{ point: null, area: dragArea }}
          className="border-dashed"
        />
      ) : null}
      {children}
    </div>
  );
}

type PinMarkerProps = { pin: FramePin; onClick: () => void };

function PinMarker({ pin, onClick }: PinMarkerProps) {
  const { point, area } = pin.selection;
  const anchor = area
    ? { x: area.x + area.width, y: area.y }
    : (point ?? { x: 0.5, y: 0.5 });
  return (
    <>
      {area ? (
        <div
          className={cn(
            "absolute rounded-sm border-2",
            pin.active ? "border-primary bg-primary/15" : "border-white/70",
          )}
          style={{
            left: percent(area.x),
            top: percent(area.y),
            width: percent(area.width),
            height: percent(area.height),
          }}
        />
      ) : null}
      <button
        type="button"
        className={cn(
          "absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold shadow-md transition-transform hover:scale-110",
          pin.active
            ? "bg-primary text-primary-foreground ring-2 ring-white"
            : "bg-white text-black",
        )}
        style={{ left: percent(anchor.x), top: percent(anchor.y) }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onClick}
      >
        {pin.label}
      </button>
    </>
  );
}
