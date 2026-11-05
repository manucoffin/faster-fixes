import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video review",
  // The pages are keyed by a Video's private Share link.
  robots: { index: false, follow: false },
};

// Public pages reached through a Share link, outside the authenticated layout
// and with no session required. Each page owns its chrome, since the header
// carries the Video's title.
export default function ReviewLayout({ children }: LayoutParams) {
  return children;
}
