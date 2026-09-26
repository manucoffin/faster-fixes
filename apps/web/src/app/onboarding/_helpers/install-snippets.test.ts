import { describe, expect, it } from "vitest";

import {
  buildReactLayoutSnippet,
  buildScriptEmbedSnippet,
} from "./install-snippets";

const PROJECT_ID = "proj_abc123";

describe("buildReactLayoutSnippet", () => {
  it("wraps the layout in a FeedbackProvider carrying the Project public ID", () => {
    const snippet = buildReactLayoutSnippet(PROJECT_ID);

    expect(snippet).toContain(
      'import { FeedbackProvider } from "@fasterfixes/react";',
    );
    expect(snippet).toContain(`<FeedbackProvider projectId="${PROJECT_ID}">`);
  });
});

describe("buildScriptEmbedSnippet", () => {
  it("renders one script tag on the @1 channel with the Project public ID", () => {
    expect(buildScriptEmbedSnippet(PROJECT_ID)).toBe(
      `<script src="https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js" data-project-id="${PROJECT_ID}" defer></script>`,
    );
  });

  it("fits on a single line", () => {
    expect(buildScriptEmbedSnippet(PROJECT_ID)).not.toContain("\n");
  });
});
