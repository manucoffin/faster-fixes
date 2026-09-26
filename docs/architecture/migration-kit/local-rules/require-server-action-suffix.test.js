import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { requireServerActionSuffixRule } from "./require-server-action-suffix.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("require-server-action-suffix", requireServerActionSuffixRule, {
  valid: [
    {
      name: "the directive in a server action file",
      filename:
        "/repo/apps/web/src/app/x/_features/y/delete-user.server.action.ts",
      code: `"use server";\nexport async function deleteUser() {}\n`,
    },
    {
      name: "a server module without the directive",
      filename: "/repo/apps/web/src/server/storage/sign-download-url.ts",
      code: `export async function signDownloadUrl() {}\n`,
    },
    {
      name: "a 'use client' directive elsewhere",
      filename: "/repo/apps/web/src/app/x/_features/y/form.client.tsx",
      code: `"use client";\nexport function Form() {}\n`,
    },
    {
      name: "a function-level directive (inline server action)",
      filename: "/repo/apps/cms/src/app/layout.tsx",
      code: `const serverFunction = async () => {\n  "use server";\n  return null;\n};\nexport { serverFunction };\n`,
    },
    {
      name: "a string expression that is not a directive",
      filename: "/repo/apps/web/src/server/storage/keys.ts",
      code: `const key = 1;\n"use server";\nexport { key };\n`,
    },
  ],
  invalid: [
    {
      name: "the directive in a plain server module",
      filename: "/repo/apps/web/src/server/storage/sign-download-url.ts",
      code: `"use server";\nexport async function signDownloadUrl() {}\n`,
      errors: [{ messageId: "unexpectedUseServer" }],
    },
    {
      name: "the directive in a server component",
      filename: "/repo/apps/web/src/app/x/_features/y/card.server.tsx",
      code: `"use server";\nexport function Card() {}\n`,
      errors: [{ messageId: "unexpectedUseServer" }],
    },
    {
      name: "the directive behind 'use strict'",
      filename: "/repo/apps/web/src/server/storage/sign-download-url.ts",
      code: `"use strict";\n"use server";\nexport async function signDownloadUrl() {}\n`,
      errors: [{ messageId: "unexpectedUseServer" }],
    },
    {
      name: "a file named like an action but with the wrong extension",
      filename:
        "/repo/apps/web/src/app/x/_features/y/delete-user.server.action.tsx",
      code: `"use server";\nexport async function deleteUser() {}\n`,
      errors: [{ messageId: "unexpectedUseServer" }],
    },
  ],
});
