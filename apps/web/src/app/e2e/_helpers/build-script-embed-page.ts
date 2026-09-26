/**
 * The end-to-end fixture for the script embed: a static page that installs the
 * Widget with one script tag, the way a WordPress or plain HTML customer would.
 * Its stylesheet is hostile on purpose, so style bleed into the Widget shows up.
 */

export const SCRIPT_EMBED_PAGE_PATH = "/e2e/script-embed";
export const SCRIPT_EMBED_IIFE_PATH = "/e2e/widget.iife.js";

type ScriptEmbedPageInput = {
  pathname: string;
  projectId: string;
  apiOrigin: string | undefined;
  // Without it the tag carries no `data-project-id` and the page waits for a manual `init`.
  autoInit: boolean;
  color: string | null;
  position: string | null;
};

const PAGES: Record<string, { title: string; body: string }> = {
  [SCRIPT_EMBED_PAGE_PATH]: {
    title: "Home",
    body: "A static page that loads the Widget from a script tag.",
  },
  [`${SCRIPT_EMBED_PAGE_PATH}/second`]: {
    title: "Second page",
    body: "Reached through an in-app navigation, without a reload.",
  },
};

const HOSTILE_CSS = `
  *, *::before, *::after { box-sizing: border-box !important; }
  * { font-family: "Comic Sans MS", "Comic Sans", cursive !important; }
  button { all: unset !important; }
`;

// Swaps the page content on a pushState navigation, like a single-page app router.
const ROUTER_SCRIPT = `
  const pages = ${JSON.stringify(PAGES)};
  function render() {
    const page = pages[location.pathname];
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildScriptTag(input: ScriptEmbedPageInput) {
  const attributes: [string, string | null | undefined][] = [
    ["src", SCRIPT_EMBED_IIFE_PATH],
    ["data-project-id", input.autoInit ? input.projectId : null],
    ["data-api-origin", input.autoInit ? input.apiOrigin : null],
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
  const page = PAGES[input.pathname];
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
      <a href="${SCRIPT_EMBED_PAGE_PATH}" data-in-app>Home</a>
      <a href="${SCRIPT_EMBED_PAGE_PATH}/second" data-in-app>Second page</a>
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
    <script>${ROUTER_SCRIPT}</script>
    ${buildScriptTag(input)}
  </body>
</html>
`;
}
