import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noClientImportOfServerErrorsRule } from "./no-client-import-of-server-errors.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

ruleTester.run(
  "no-client-import-of-server-errors",
  noClientImportOfServerErrorsRule,
  {
    valid: [
      {
        name: "a server module importing the server errors",
        filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
        code: `import { DomainError } from "@/server/errors";\n`,
      },
      {
        name: "a client module importing an unrelated server module",
        filename:
          "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
        code: `import { formatCents } from "@/server/format";\n`,
      },
      {
        name: "a client module importing a path that only starts like the errors folder",
        filename:
          "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
        code: `import { toMessage } from "@/server/errors-ui";\n`,
      },
    ],
    invalid: [
      {
        name: "a .client.tsx module importing the server errors barrel",
        filename:
          "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
        code: `import { DomainError } from "@/server/errors";\n`,
        errors: [{ messageId: "clientImportsServerErrors" }],
      },
      {
        name: "a 'use client' module deep-importing a server error class",
        filename: "/repo/apps/web/src/app/_domains/billing/plan-form.tsx",
        code: `"use client";\nimport { NotFoundError } from "@/server/errors/not-found";\n`,
        errors: [{ messageId: "clientImportsServerErrors" }],
      },
    ],
  },
);
