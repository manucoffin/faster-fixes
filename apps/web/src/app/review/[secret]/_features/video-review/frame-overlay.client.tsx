"use client";

import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import { SelectionMarker } from "@/app/_domains/video/_components/selection-marker";
import { mapSelectionToBox } from "@/app/_domains/video/_helpers/map-selection-to-box";
import { placeComposerPopover } from "../../_helpers/place-composer-popover";
import {
  readFrameGesture,
  toFramePosition,
} from "../../_helpers/read-frame-gesture";
import type { VideoSelection } from "@/app/_domains/video/_types/video-selection";

type Size = { width: number; height: number };
type Position = { x: number; y: number };
type Drag = { start: Position; current: Position };

function useElementSize(element: HTMLElement | null) {
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        width: entry.borderBoxSize[0]?.inlineSize ?? 0,
        height: entry.borderBoxSize[0]?.blockSize ?? 0,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return element ? size : null;
}

type FrameOverlayProps = {
  frame: Size;
  selection: VideoSelection | null;
  paused: boolean;
  /** The composer, floated beside the marker; null keeps it elsewhere. */
  popover: ReactNode;
  onMark: (selection: VideoSelection) => void;
  onPause: () => void;
};

// Sits over the player's frame: a click on the paused frame places a point, a
// drag outlines an area, both normalized to the frame so they survive a resize.
// A click on a playing Video only pauses it.
export function FrameOverlay({
  frame,
  selection,
  paused,
  popover,
  onMark,
  onPause,
}: FrameOverlayProps) {
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(
    null,
  );
  const box = useElementSize(surface);
  const popoverSize = useElementSize(popoverElement);
  const [drag, setDrag] = useState<Drag | null>(null);

  function toPosition(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return toFramePosition(
      {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      },
      frame,
      rect,
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = toPosition(event);
    setDrag({ start: position, current: position });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setDrag({ start: drag.start, current: toPosition(event) });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setDrag(null);
    const gesture = readFrameGesture(drag.start, toPosition(event));
    if (gesture.point && !paused) {
      onPause();
      return;
    }
    onMark(gesture);
  }

  const dragArea = drag ? readFrameGesture(drag.start, drag.current) : null;
  const drawn = dragArea?.area ? dragArea : selection;
  const geometry = drawn && box ? mapSelectionToBox(drawn, frame, box) : null;
  const anchor =
    selection && box ? mapSelectionToBox(selection, frame, box) : null;
  const position =
    anchor && box && popoverSize
      ? placeComposerPopover(anchor, box, popoverSize)
      : null;

  return (
    <div className="absolute inset-0">
      <div
        ref={setSurface}
        className="absolute inset-0 cursor-crosshair touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
      />
      {geometry ? (
        <SelectionMarker
          geometry={geometry}
          className={drawn === dragArea ? "border-dashed" : undefined}
        />
      ) : null}
      {popover && anchor ? (
        // Measured before it is shown, so it never flashes outside the frame.
        <div
          ref={setPopoverElement}
          className="absolute z-10 w-80 max-w-full"
          style={
            position
              ? { left: position.left, top: position.top }
              : { visibility: "hidden" }
          }
        >
          {popover}
        </div>
      ) : null}
    </div>
  );
}
