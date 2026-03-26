import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";

export function baseOptions(): Omit<DocsLayoutProps, "tree" | "children"> {
  return {
    nav: { title: "" },
    themeSwitch: { enabled: false },
    sidebar: { collapsible: false },
  };
}
