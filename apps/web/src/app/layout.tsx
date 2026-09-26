import { APP_URL } from "@/app/_constants/app";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { TRPCProviderWrapper as TRPCProvider } from "@/lib/trpc/trpc-provider.client";
import { FeedbackProvider } from "@fasterfixes/react";
import { Analytics } from "@vercel/analytics/next";
import "@workspace/ui/globals.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { StopImpersonateButton } from "./_domains/auth/stop-impersonate-button/stop-impersonate-button.client";
import { ConsentProvider } from "./_providers/consent-provider.client";

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: SITE_NAME,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_META_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-smooth"
      data-scroll-behavior="smooth"
    >
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ConsentProvider>
            <TRPCProvider>
              <NuqsAdapter>
                <StopImpersonateButton />

                <FeedbackProvider
                  projectId={process.env.NEXT_PUBLIC_FF_API_KEY ?? ""}
                  apiOrigin={process.env.NEXT_PUBLIC_FF_API_ORIGIN}
                  position="bottom-right"
                  captureDiagnostics={true}
                >
                  <RootProvider>{children}</RootProvider>
                </FeedbackProvider>

                <Toaster />
              </NuqsAdapter>
            </TRPCProvider>
          </ConsentProvider>
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  );
}
