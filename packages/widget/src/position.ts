import type { WidgetPosition } from "@fasterfixes/core";

export type PositionStyle = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  transform?: string;
};

const EDGE_OFFSET = "20px";

const POSITION_STYLES: Record<WidgetPosition, PositionStyle> = {
  "bottom-right": { bottom: EDGE_OFFSET, right: EDGE_OFFSET },
  "bottom-left": { bottom: EDGE_OFFSET, left: EDGE_OFFSET },
  "top-right": { top: EDGE_OFFSET, right: EDGE_OFFSET },
  "top-left": { top: EDGE_OFFSET, left: EDGE_OFFSET },
  "middle-right": {
    top: "50%",
    right: EDGE_OFFSET,
    transform: "translateY(-50%)",
  },
  "middle-left": {
    top: "50%",
    left: EDGE_OFFSET,
    transform: "translateY(-50%)",
  },
};

export function getPositionStyle(position: WidgetPosition) {
  return { ...POSITION_STYLES[position] };
}
