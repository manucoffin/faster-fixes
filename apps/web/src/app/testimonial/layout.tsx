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
      <header className="mx-auto flex w-full max-w-xl justify-center py-6">
        <AppLogo className="text-lg" />
      </header>
      {/* Each page is a single short step, so it sits in the middle of the
          screen rather than under the logo. */}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pb-16">
        {children}
      </main>
    </div>
  );
}
