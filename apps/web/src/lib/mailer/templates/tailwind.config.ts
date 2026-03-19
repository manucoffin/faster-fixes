/**
 * Tailwind config for email templates.
 *
 * Email clients don't support CSS variables, so we duplicate the theme
 * colors from globals.css as static hex values. Keep these in sync when
 * the app theme changes.
 */
export const emailTailwindConfig = {
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0a0a0a",
        card: "#ffffff",
        "card-foreground": "#0a0a0a",
        primary: "#171717",
        "primary-foreground": "#fafafa",
        secondary: "#f5f5f5",
        "secondary-foreground": "#171717",
        muted: "#f5f5f5",
        "muted-foreground": "#737373",
        border: "#e5e5e5",
      },
    },
  },
} as const;
