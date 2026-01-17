import { TRPCProvider } from "@/lib/trpc/trpc-provider";
import "@workspace/ui/globals.css";
import { ThemeProvider } from "next-themes";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            {/* <NuqsAdapter>
              <Header /> */}
            {children}

            <Toaster />
            {/* </NuqsAdapter> */}
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
