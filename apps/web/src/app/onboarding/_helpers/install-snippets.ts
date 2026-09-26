export const REACT_INSTALL_COMMAND = "npm install @fasterfixes/react";

// The `@1` channel serves every 1.x release, so the snippet never needs editing for a fix.
export const SCRIPT_EMBED_URL =
  "https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js";

export function buildReactLayoutSnippet(projectId: string) {
  return `import { FeedbackProvider } from "@fasterfixes/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <FeedbackProvider projectId="${projectId}">
          {children}
        </FeedbackProvider>
      </body>
    </html>
  );
}`;
}

export function buildScriptEmbedSnippet(projectId: string) {
  return `<script src="${SCRIPT_EMBED_URL}" data-project-id="${projectId}" defer></script>`;
}
