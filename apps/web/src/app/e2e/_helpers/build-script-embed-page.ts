/**
 * The end-to-end fixture for the script embed: a static page that installs the
 * Widget with one script tag, the way a WordPress or plain HTML customer would.
 * Its stylesheet is hostile on purpose, so style bleed into the Widget shows up.
 * Under `/inline-init` the page calls `window.FasterFixes.init` itself instead,
 * the way a customer passes options with no `data-*` attribute, like `customMetadata`.
 * With `tall`, the page grows far below the fold, so a scenario can scroll before selecting.
 */

export const SCRIPT_EMBED_PAGE_PATH = "/e2e/script-embed";
export const SCRIPT_EMBED_IIFE_PATH = "/e2e/widget.iife.js";
const INLINE_INIT_PATH = `${SCRIPT_EMBED_PAGE_PATH}/inline-init`;

type ScriptEmbedPageInput = {
  pathname: string;
  projectId: string;
  apiOrigin: string | undefined;
  // Without it the tag carries no `data-project-id` and the page waits for a manual `init`.
  autoInit: boolean;
  color: string | null;
  position: string | null;
  tall: boolean;
};

// Keyed by the path below the fixture's base, so both bases serve the same pages.
const PAGES: Record<string, { title: string; body: string }> = {
  "": {
    title: "Home",
    body: "A static page that loads the Widget from a script tag.",
  },
  "/second": {
    title: "Second page",
    body: "Reached through an in-app navigation, without a reload.",
  },
};

const HOSTILE_CSS = `
  *, *::before, *::after { box-sizing: border-box !important; }
  * { font-family: "Comic Sans MS", "Comic Sans", cursive !important; }
  button { all: unset !important; }
`;

// Distinct solid colours, so a blank or offset capture of a scrolled viewport stands out.
const BELOW_FOLD_COLORS = [
  "#dc2626",
  "#16a34a",
  "#2563eb",
  "#ca8a04",
  "#9333ea",
];

function buildBelowFold() {
  const blocks = BELOW_FOLD_COLORS.map(
    (color, index) =>
      `<div style="height: 600px; padding: 24px; background: ${color}; color: #fff;">Block ${String(index + 1)}</div>`,
  ).join("");
  return `<section id="below-fold">${blocks}<h2 id="below-fold-target">Below the fold</h2></section>`;
}

// Swaps the page content on a pushState navigation, like a single-page app router.
function buildRouterScript(basePath: string) {
  return `
  const pages = ${JSON.stringify(PAGES)};
  function render() {
    const page = pages[location.pathname.slice(${String(basePath.length)})];
    if (!page) return;
    document.title = page.title;
    document.getElementById("page-title").textContent = page.title;
    document.getElementById("page-body").textContent = page.body;
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-in-app]");
    if (!link) return;
    event.preventDefault();
    history.pushState(null, "", link.href);
    render();
  });
  window.addEventListener("popstate", render);
`;
}

function buildInlineInitScript(input: ScriptEmbedPageInput) {
  const options = { projectId: input.projectId, apiOrigin: input.apiOrigin };
  return `
  window.FasterFixes.init({
    ...${JSON.stringify(options)},
    // Read at each submission: the end-to-end suite flips the \`dark\` class after init.
    customMetadata: () => ({
      app: "script",
      colorScheme: document.documentElement.classList.contains("dark")
        ? "dark"
        : "light",
    }),
  });
`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildScriptTag(input: ScriptEmbedPageInput, autoInit: boolean) {
  const attributes: [string, string | null | undefined][] = [
    ["src", SCRIPT_EMBED_IIFE_PATH],
    ["data-project-id", autoInit ? input.projectId : null],
    ["data-api-origin", autoInit ? input.apiOrigin : null],
    ["data-color", input.color],
    ["data-position", input.position],
  ];
  const rendered = attributes
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(" ");
  return `<script ${rendered}></script>`;
}

/** Returns the fixture HTML, or `null` for a path the fixture does not serve. */
export function buildScriptEmbedPage(input: ScriptEmbedPageInput) {
  const inlineInit = input.pathname.startsWith(INLINE_INIT_PATH);
  const basePath = inlineInit ? INLINE_INIT_PATH : SCRIPT_EMBED_PAGE_PATH;
  const page = PAGES[input.pathname.slice(basePath.length)];
  if (!page) return null;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${page.title}</title>
    <style>${HOSTILE_CSS}</style>
  </head>
  <body>
    <nav>
      <a href="${basePath}" data-in-app>Home</a>
      <a href="${basePath}/second" data-in-app>Second page</a>
    </nav>
    <main>
      <h1 id="page-title">${page.title}</h1>
      <p id="page-body">${page.body}</p>
      <section id="pricing-card">
        <h2>Pricing</h2>
        <p>Every plan includes unlimited Reviewers.</p>
        <button type="button" id="primary-action">Get started</button>
      </section>
    </main>
    ${input.tall ? buildBelowFold() : ""}
    <script>${buildRouterScript(basePath)}</script>
    ${buildScriptTag(input, input.autoInit && !inlineInit)}
    ${inlineInit ? `<script>${buildInlineInitScript(input)}</script>` : ""}
  </body>
</html>
`;
}
