type Marker = {
  point: unknown | null;
  area: unknown | null;
};

// The one-word summary of what a Selection carries on the frame, or `null`
// when it only anchors a time.
export function describeMarker(
  marker: Marker,
  pointLabel = "Point placed",
): string | null {
  if (marker.area) return "Area outlined";
  if (marker.point) return pointLabel;
  return null;
}
