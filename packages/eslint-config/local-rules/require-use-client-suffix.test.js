import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { requireUseClientSuffixRule } from "./require-use-client-suffix.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// The shape the shared config passes: one pattern anchored on the whole
// basename, so it exempts the Next.js special files and nothing that merely
// ends in one of their names.
const nextSpecialFileOptions = [
  {
    ignorePathPatterns: ["/app/(?:.*/)?(?:layout|page)\\.tsx?$"],
  },
];

ruleTester.run("require-use-client-suffix", requireUseClientSuffixRule, {
  valid: [
    {
      name: "a .client.tsx file carrying the directive",
      filename: "/repo/apps/web/src/app/_features/project/panel.client.tsx",
      code: `"use client";\nexport function Panel() {\n  return <div />;\n}\n`,
    },
    {
      name: "a server component without the directive",
      filename: "/repo/apps/web/src/app/_features/project/panel.tsx",
      code: `export function Panel() {\n  return <div />;\n}\n`,
    },
    {
      name: "a use-* hook file carrying the directive",
      filename: "/repo/apps/web/src/hooks/use-project.ts",
      code: `"use client";\nexport function useProject() {}\n`,
    },
    {
      name: "a use-* hook in .tsx because it also exports a provider",
      filename: "/repo/apps/web/src/hooks/use-project.tsx",
      code: `"use client";\nexport function useProject() {\n  return <div />;\n}\n`,
    },
    {
      name: "a .context.tsx file carrying the directive",
      filename: "/repo/apps/web/src/app/_features/project/project.context.tsx",
      code: `"use client";\nexport const ProjectContext = null;\n`,
    },
    {
      name: "a Next.js page matched by ignorePathPatterns",
      filename: "/repo/apps/web/src/app/(authenticated)/projects/page.tsx",
      code: `"use client";\nexport default function Page() {\n  return <div />;\n}\n`,
      options: nextSpecialFileOptions,
    },
    {
      name: "a Next.js layout matched by ignorePathPatterns",
      filename: "/repo/apps/web/src/app/layout.tsx",
      code: `"use client";\nexport default function Layout() {\n  return <div />;\n}\n`,
      options: nextSpecialFileOptions,
    },
    {
      // The client/server import rules read `.client.ts` as a client module,
      // so this rule reads it as carrying the suffix too.
      name: "a .client.ts file carrying the directive",
      filename: "/repo/apps/web/src/app/_features/project/use-panel.client.ts",
      code: `"use client";\nexport const panelId = "panel";\n`,
    },
    {
      name: "a Next.js page at the app root, with no folder before it",
      filename: "/repo/apps/web/src/app/page.tsx",
      code: `"use client";\nexport default function Page() {\n  return <div />;\n}\n`,
      options: nextSpecialFileOptions,
    },
    {
      name: "a .client.tsx file using single quotes for the directive",
      filename: "/repo/apps/web/src/app/_features/project/panel.client.tsx",
      code: `'use client';\nexport function Panel() {\n  return <div />;\n}\n`,
    },
  ],
  invalid: [
    {
      name: "a component with the directive but no .client suffix",
      filename: "/repo/apps/web/src/app/_features/project/panel.tsx",
      code: `"use client";\nexport function Panel() {\n  return <div />;\n}\n`,
      errors: [{ messageId: "missingClientSuffix" }],
    },
    {
      name: "a component outside _features with the directive but no .client suffix",
      filename: "/repo/apps/web/src/components/toolbar.tsx",
      code: `"use client";\nexport function Toolbar() {\n  return <div />;\n}\n`,
      errors: [{ messageId: "missingClientSuffix" }],
    },
    {
      // The ignore patterns name the Next.js special files, not every file
      // whose name happens to end in one of their words.
      name: "a component whose name merely ends in a special file name",
      filename:
        "/repo/apps/web/src/app/(authenticated)/projects/_features/edit-page.tsx",
      code: `"use client";\nexport function EditPage() {\n  return <div />;\n}\n`,
      options: nextSpecialFileOptions,
      errors: [
        {
          messageId: "missingClientSuffix",
          data: { suggested: "edit-page.client.tsx" },
        },
      ],
    },
    {
      // The suggestion keeps the file's own extension, so it names a rename
      // the reader can actually make.
      name: "a .ts module with the directive, told to become .client.ts",
      filename: "/repo/apps/web/src/app/_features/project/panel-id.ts",
      code: `"use client";\nexport const panelId = "panel";\n`,
      errors: [
        {
          messageId: "missingClientSuffix",
          data: { suggested: "panel-id.client.ts" },
        },
      ],
    },
    {
      name: "a .client.tsx file missing the directive",
      filename: "/repo/apps/web/src/app/_features/project/panel.client.tsx",
      code: `export function Panel() {\n  return <div />;\n}\n`,
      errors: [{ messageId: "missingUseClient" }],
    },
    {
      name: "a .client.ts file missing the directive",
      filename: "/repo/apps/web/src/app/_features/project/panel-id.client.ts",
      code: `export const panelId = "panel";\n`,
      errors: [{ messageId: "missingUseClient" }],
    },
    {
      name: "a .client.tsx file where the directive is not the first statement",
      filename: "/repo/apps/web/src/app/_features/project/panel.client.tsx",
      code: `import { useState } from "react";\n"use client";\nexport function Panel() {\n  return <div />;\n}\n`,
      errors: [{ messageId: "missingUseClient" }],
    },
  ],
});
