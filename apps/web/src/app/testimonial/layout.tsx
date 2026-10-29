import { AppLogo } from "@/app/_components/app-logo";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share your experience",
  // The pages are keyed by a private token.
  robots: { index: false, follow: false },
};

// Bare public pages reached from the Testimonial request emails: logo only,
// outside the marketing layout, and no session required.
export default function TestimonialLayout({ children }: LayoutParams) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4">
      <header className="mx-auto w-full max-w-xl py-6">
        <AppLogo className="text-lg" />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 pb-16">{children}</main>
    </div>
  );
}
