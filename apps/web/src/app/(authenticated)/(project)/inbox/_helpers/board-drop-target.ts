import type { Over } from "@dnd-kit/core";

// A drop lands on a column or on one of its cards, and both carry the Status.
export function readDropStatus(over: Over | null) {
  const status: unknown = over?.data.current?.status;
  return typeof status === "string" ? status : null;
}
