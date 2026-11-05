/** Where on the frame a Feedback points, normalized 0..1 to the Video. */
export type VideoSelection = {
  point: { x: number; y: number } | null;
  area: { x: number; y: number; width: number; height: number } | null;
};
