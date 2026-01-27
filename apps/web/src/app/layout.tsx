import { TRPCProvider } from "@/lib/trpc/trpc-provider";
import "@workspace/ui/globals.css";
import { ThemeProvider } from "next-themes";
import { Outfit } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from "sonner";
import { StopImpersonateButton } from "./_features/auth/stop-impersonate-button/stop-impersonate-button.client";
import { ConsentProvider } from "./_features/c15t/consent-provider";

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} font-sans antialiased `}
      >
        <ConsentProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <TRPCProvider>
              <NuqsAdapter>
                <StopImpersonateButton />

                {children}

                <Toaster />
              </NuqsAdapter>
            </TRPCProvider>
          </ThemeProvider>
        </ConsentProvider>
      </body>
    </html>
  )
}
