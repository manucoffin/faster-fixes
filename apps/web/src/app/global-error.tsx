"use client";

import { ErrorScreen } from "@/app/_components/error-screen";
import { ERROR_BOUNDARY_COPY } from "@/app/_constants/error-screens";
import { Button } from "@workspace/ui/components/button";
import "@workspace/ui/globals.css";
import { ThemeProvider } from "next-themes";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { useEffect } from "react";

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// `digest` is left out on purpose: the boundary logs the error object and
// renders none of its fields, so nothing here can leak internals.
type GlobalErrorBoundaryProps = {
  error: Error;
  retry: () => void;
};

// Catches a failure of the root layout itself, which this file replaces. It
// therefore declares the document, the stylesheet, the fonts and the theme that
// the layout would have provided, and has no `metadata` export to give it a
// title (Next.js `global-error` constraints).
export default function GlobalErrorBoundary({
  error,
  retry,
}: GlobalErrorBoundaryProps) {
  // The only place the raw error is read: the screen itself shows fixed copy.
  useEffect(() => {
    console.error("Global render error", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <title>{ERROR_BOUNDARY_COPY.title}</title>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <main className="flex flex-1 flex-col">
            <ErrorScreen
              title={ERROR_BOUNDARY_COPY.title}
              description={ERROR_BOUNDARY_COPY.description}
            >
              <Button onClick={() => retry()}>
                {ERROR_BOUNDARY_COPY.retryLabel}
              </Button>
            </ErrorScreen>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
