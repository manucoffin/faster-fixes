"use client";

import { Button } from "@workspace/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type ThemeToggleProps = React.ComponentProps<typeof Button>;

export const ThemeToggle = ({ ...props }: ThemeToggleProps) => {
  const { setTheme, theme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <Button
      aria-label="Toggle bold"
      onClick={() => handleThemeChange(theme === "light" ? "dark" : "light")}
      {...props}
    >
      {theme === "light" ? (
        <Moon aria-hidden="true" />
      ) : (
        <Sun aria-hidden="true" />
      )}
    </Button>
  );
};
