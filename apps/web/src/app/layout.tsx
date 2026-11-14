import { APP_URL } from "@/app/_constants/app";
import {
  OG_IMAGE_SIZE,
  SITE_META_DESCRIPTION,
  SITE_NAME,
  SITE_OG_LOCALE,
  SITE_TAGLINE,
} from "@/app/_constants/seo";
import { TRPCProviderWrapper as TRPCProvider } from "@/lib/trpc/trpc-provider.client";
import { isCloud } from "@/utils/environment/env";
import { Analytics } from "@vercel/analytics/next";
import "@workspace/ui/globals.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { StopImpersonateButton } from "./_domains/auth/stop-impersonate-button/stop-impersonate-button.client";
import { AppFeedbackProvider } from "./_providers/app-feedback-provider.client";
import { ConsentProvider } from "./_providers/consent-provider.client";
import { ThemeProvider } from "./_providers/theme-provider.client";

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// Pages outside `(public)` set no social metadata of their own and share the
// home page's card.
const defaultOgImage = {
  url: "/og",
  ...OG_IMAGE_SIZE,
  alt: `${SITE_NAME}: ${SITE_TAGLINE}`,
  type: "image/png",
};

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
    locale: SITE_OG_LOCALE,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOgImage],
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
        <ThemeProvider>
          <ConsentProvider>
            <TRPCProvider>
              <NuqsAdapter>
                <StopImpersonateButton />

                <AppFeedbackProvider>
                  <RootProvider>{children}</RootProvider>
                </AppFeedbackProvider>

                <Toaster />
              </NuqsAdapter>
            </TRPCProvider>
          </ConsentProvider>
        </ThemeProvider>

        {isCloud() && <Analytics />}
      </body>
    </html>
  );
}
