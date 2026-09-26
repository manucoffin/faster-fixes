import { DEFAULT_WIDGET_COLOR } from "@fasterfixes/core";

// Theming surface: a customer overrides any of these on the `[data-ff-widget]`
// host. Rules in the page's stylesheet win over `:host`, so these are defaults.
export const THEME_DEFAULTS = {
  "--ff-accent": DEFAULT_WIDGET_COLOR,
  "--ff-background": "#1c1c1c",
  "--ff-foreground": "#e4e4e7",
  "--ff-radius": "8px",
  "--ff-font-family":
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "--ff-z-index": "2147483647",
};

const themeDeclarations = Object.entries(THEME_DEFAULTS)
  .map(([name, value]) => `${name}: ${value};`)
  .join("\n    ");

// `all: initial` stops inherited page styles (fonts, colors, line height) from
// crossing the shadow boundary; custom properties are not reset by `all`.
export const WIDGET_CSS = `
  :host {
    all: initial;
    display: contents;
    ${themeDeclarations}
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .stack {
    position: fixed;
    z-index: var(--ff-z-index);
    display: flex;
    gap: 8px;
    font-family: var(--ff-font-family);
    color: var(--ff-foreground);
    pointer-events: auto;
  }

  .button {
    all: initial;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--ff-accent);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    animation: ff-button-pop 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    transition: transform 0.16s ease;
  }

  .button:hover {
    transform: scale(1.05);
  }

  .button:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }

  .button svg {
    display: block;
  }

  .tooltip {
    position: absolute;
    top: 50%;
    width: max-content;
    max-width: 180px;
    padding: 6px 8px;
    border-radius: calc(var(--ff-radius) - 2px);
    background: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
    font: 500 12px/1.2 var(--ff-font-family);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 130ms ease,
      transform 130ms ease,
      visibility 130ms ease;
    transition-delay: 650ms;
  }

  .tooltip[data-side="left"] {
    right: calc(100% + 10px);
    transform: translate(4px, -50%) scale(0.96);
  }

  .tooltip[data-side="right"] {
    left: calc(100% + 10px);
    transform: translate(-4px, -50%) scale(0.96);
  }

  .button:hover .tooltip,
  .button:focus-visible .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translate(0, -50%) scale(1);
  }

  @keyframes ff-button-pop {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .button,
    .tooltip {
      animation: none;
      transition-duration: 1ms;
    }
  }
`;
