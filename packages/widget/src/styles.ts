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

  .toolbar {
    position: relative;
    display: flex;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: var(--ff-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    animation: ff-button-pop 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    transition:
      height 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      border-radius 0.22s ease,
      transform 0.16s ease;
  }

  .toolbar[data-state="expanded"] {
    height: 112px;
    border-radius: 24px;
  }

  .toolbar[data-state="collapsed"]:hover {
    transform: scale(1.05);
  }

  /* A class that sets display would otherwise beat the UA rule for hidden. */
  [hidden] {
    display: none !important;
  }

  .button {
    all: initial;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    transition:
      opacity 150ms ease,
      transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .button[data-visible="false"] {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.72);
  }

  .button:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }

  .button svg,
  .control svg {
    display: block;
  }

  .controls {
    position: absolute;
    inset: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition:
      opacity 150ms ease,
      transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
      filter 220ms ease;
  }

  .controls[data-visible="false"] {
    opacity: 0;
    pointer-events: none;
    filter: blur(6px);
    transform: scale(0.72) translateY(6px);
  }

  .control {
    all: initial;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.15);
    color: #fff;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .control:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .control-pressed {
    background-color: rgba(0, 0, 0, 0.25);
  }

  .control:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 1px;
  }

  .overlay {
    position: fixed;
    z-index: calc(var(--ff-z-index) - 2);
    border: 2px solid var(--ff-accent);
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--ff-accent) 10%, transparent);
    pointer-events: none;
    transition: all 0.1s ease;
  }

  .highlight {
    position: fixed;
    z-index: calc(var(--ff-z-index) - 2);
    border: 2px solid var(--ff-accent);
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--ff-accent) 10%, transparent);
    pointer-events: none;
  }

  .pin {
    all: initial;
    position: absolute;
    z-index: calc(var(--ff-z-index) - 1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    border: 2px solid #27272a;
    border-radius: 50%;
    color: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    pointer-events: auto;
    transition: transform 0.15s ease;
  }

  .pin:hover {
    transform: scale(1.15);
  }

  .pin-active,
  .pin-active:hover {
    transform: scale(1.2);
  }

  .pin:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }

  .pin svg {
    display: block;
  }

  .popover {
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--ff-z-index);
    width: 320px;
    padding: 16px;
    border-radius: var(--ff-radius);
    background-color: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font: 14px/1.4 var(--ff-font-family);
    pointer-events: auto;
  }

  .popover.fading {
    animation: ff-popover-fadeout 200ms ease-in forwards;
  }

  .popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .popover-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .status-dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .reviewer {
    overflow: hidden;
    color: #71717a;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-action {
    all: initial;
    display: flex;
    padding: 4px;
    border-radius: calc(var(--ff-radius) - 2px);
    color: #a1a1aa;
    cursor: pointer;
  }

  .icon-action:hover {
    color: var(--ff-foreground);
  }

  .icon-action:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }

  .comment {
    margin: 0 0 10px;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .textarea {
    all: initial;
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-height: 80px;
    padding: 8px;
    border: 1px solid #3f3f46;
    border-radius: calc(var(--ff-radius) - 2px);
    background-color: #27272a;
    color: var(--ff-foreground);
    font: 14px/1.4 var(--ff-font-family);
    resize: vertical;
    white-space: pre-wrap;
  }

  .textarea:focus {
    border-color: var(--ff-accent);
  }

  .textarea::placeholder {
    color: #71717a;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  .actions-start {
    justify-content: flex-start;
  }

  .action {
    all: initial;
    padding: 6px 14px;
    border-radius: calc(var(--ff-radius) - 2px);
    font: 500 13px/1.4 var(--ff-font-family);
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .action:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }

  .action:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .action-primary {
    background-color: var(--ff-accent);
    color: #fff;
  }

  .action-secondary {
    background-color: transparent;
    color: #a1a1aa;
  }

  .action-danger {
    background-color: #dc2626;
    color: #fff;
  }

  .action-destructive {
    color: #dc2626;
  }

  .error-message {
    margin: 0 0 8px;
    color: #dc2626;
    font-size: 13px;
  }

  .list {
    display: flex;
    flex-direction: column;
    width: 320px;
    max-height: 320px;
    overflow: hidden;
    border-radius: var(--ff-radius);
    background-color: var(--ff-background);
    color: var(--ff-foreground);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font: 13px/1.4 var(--ff-font-family);
    animation: 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .list[data-from="right"] {
    animation-name: ff-list-slide-left;
  }

  .list[data-from="left"] {
    animation-name: ff-list-slide-right;
  }

  .list.closing {
    animation: 150ms ease-in forwards;
  }

  .list.closing[data-from="right"] {
    animation-name: ff-list-exit-left;
  }

  .list.closing[data-from="left"] {
    animation-name: ff-list-exit-right;
  }

  .list-header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #3f3f46;
  }

  .list-title {
    font-weight: 600;
  }

  .list-toggle {
    all: initial;
    padding: 2px 8px;
    border-radius: calc(var(--ff-radius) - 2px);
    color: inherit;
    font: 11px/1.4 var(--ff-font-family);
    text-decoration: underline;
    cursor: pointer;
  }

  .list-toggle:focus-visible,
  .list-footer a:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: 2px;
  }

  .list-rows {
    flex: 1 1 auto;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .list-item {
    all: initial;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    border-bottom: 1px solid #3f3f46;
    box-sizing: border-box;
    color: var(--ff-foreground);
    font: 13px/1.4 var(--ff-font-family);
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .list-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .list-item:focus-visible {
    outline: 2px solid var(--ff-accent);
    outline-offset: -2px;
  }

  .list-item-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .list-item-comment,
  .list-item-page {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .list-item-page {
    color: #71717a;
    font-size: 11px;
  }

  .list-empty {
    margin: 0;
    padding: 20px 14px;
    color: #71717a;
    text-align: center;
  }

  .list-footer {
    flex: none;
    padding: 6px 14px;
    border-top: 1px solid #3f3f46;
    font-size: 10px;
    text-align: center;
  }

  .list-footer a {
    color: #71717a;
    text-decoration: none;
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
  .button:focus-visible .tooltip,
  .control:hover .tooltip,
  .control:focus-visible .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translate(0, -50%) scale(1);
  }

  @keyframes ff-button-pop {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes ff-list-slide-left {
    from { transform: translateX(12px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes ff-list-slide-right {
    from { transform: translateX(-12px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes ff-list-exit-left {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(12px); opacity: 0; }
  }

  @keyframes ff-list-exit-right {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-12px); opacity: 0; }
  }

  @keyframes ff-popover-fadeout {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(8px); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .toolbar,
    .button,
    .controls,
    .list-item,
    .overlay,
    .pin,
    .popover.fading,
    .tooltip {
      animation: none;
      transition-duration: 1ms;
    }

    /* The list's exit animation is timed, so it is shortened rather than removed. */
    .list,
    .list.closing {
      animation-duration: 1ms;
    }
  }
`;

/**
 * The `color` option as a `:host` rule rather than an inline style, so a page
 * stylesheet that sets `--ff-accent` on the host still wins over it.
 */
export function accentRule(color: string) {
  // The value lands in a stylesheet: a `;` or a brace would escape the declaration.
  return /[;{}]/.test(color) ? "" : `:host { --ff-accent: ${color}; }`;
}
