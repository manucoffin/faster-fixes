"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

// next-themes renders an inline script that must run from the server HTML to
// avoid a theme flash. When React creates that element on the client it warns
// that the script will never execute, so the client copy is typed as a data
// block (next-themes already suppresses the hydration mismatch on it).
const scriptProps = {
  type: typeof window === "undefined" ? "text/javascript" : "application/json",
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
      scriptProps={scriptProps}
    >
      {children}
    </NextThemesProvider>
  );
}
