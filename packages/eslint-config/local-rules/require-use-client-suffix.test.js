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

// The globs in the shared config exempt the Next.js special files by path.
const nextSpecialFileOptions = [
  { ignorePathPatterns: ["/app/.*page\\.tsx$", "/app/.*layout\\.tsx$"] },
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
