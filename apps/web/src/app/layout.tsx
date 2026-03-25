import { APP_URL } from "@/app/_constants/app";
import {
  DEFAULT_OG_IMAGE_URL,
  SITE_META_DESCRIPTION,
  SITE_NAME,
} from "@/app/_constants/seo";
import { TRPCProviderWrapper as TRPCProvider } from "@/lib/trpc/trpc-provider";
import { FeedbackProvider } from "@fasterfixes/react";
import "@workspace/ui/globals.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { StopImpersonateButton } from "./_features/auth/stop-impersonate-button/stop-impersonate-button.client";
import { ConsentProvider } from "./_features/c15t/consent-provider";

const fontSans = Outfit({
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
    locale: "fr_FR",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
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
    <html lang="fr" suppressHydrationWarning className="scroll-smooth">
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
                  apiKey={process.env.NEXT_PUBLIC_FF_API_KEY ?? ""}
                  apiOrigin={process.env.NEXT_PUBLIC_FF_API_ORIGIN}
                >
                  <RootProvider>{children}</RootProvider>
                </FeedbackProvider>

                <Toaster />
              </NuqsAdapter>
            </TRPCProvider>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
