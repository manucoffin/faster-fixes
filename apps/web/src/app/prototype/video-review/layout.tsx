import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video review prototype",
  robots: { index: false, follow: false },
};

// PROTOTYPE: throwaway route, see the wayfinder ticket "Reviewer annotation
// page prototype". Each variant owns its own chrome, so the layout only sets
// the metadata.
export default function VideoReviewPrototypeLayout({ children }: LayoutParams) {
  return children;
}
