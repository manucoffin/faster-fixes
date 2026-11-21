import { describe, expect, it } from "vitest";

import {
  buildQuickStartPrompt,
  findQuickStartFramework,
  quickStartFrameworks,
} from "./build-quick-start-prompt";

describe("buildQuickStartPrompt", () => {
  it("installs the React package and wraps the Next.js root layout", () => {
    const prompt = buildQuickStartPrompt({
      framework: findQuickStartFramework("react"),
      projectValue: "nextjs",
    });

    expect(prompt).toContain("this React project with Next.js");
    expect(prompt).toContain("1. Install @fasterfixes/react");
    expect(prompt).toContain("app/layout.tsx");
    expect(prompt).toContain(
      "https://www.faster-fixes.com/docs/widget/install/react",
    );
  });

  it("falls back to the framework's first project for an unknown project", () => {
    const prompt = buildQuickStartPrompt({
      framework: findQuickStartFramework("vue"),
      projectValue: "nextjs",
    });

    expect(prompt).toContain("this Vue project with Vite");
  });

  it("skips the install step for the script tag", () => {
    const prompt = buildQuickStartPrompt({
      framework: findQuickStartFramework("script"),
    });

    expect(prompt).not.toContain("Install ");
    expect(prompt).toContain("1. Add this tag");
    expect(prompt).toContain('data-project-id="proj_your_project_id"');
  });

  it("asks for the Project ID and explains how Reviewers see the widget, for every choice", () => {
    for (const framework of quickStartFrameworks) {
      for (const project of framework.projects ?? [undefined]) {
        const prompt = buildQuickStartPrompt({
          framework,
          projectValue: project?.value,
        });

        expect(prompt).toContain("ask me for my Faster Fixes Project ID");
        expect(prompt).toContain("proj_your_project_id");
        expect(prompt).toContain("review link");
      }
    }
  });
});
