import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noClientImportOfServerFolderRule } from "./no-client-import-of-server-folder.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const CLIENT_TSX =
  "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx";
const CLIENT_TS =
  "/repo/apps/web/src/app/_domains/billing/use-plan-totals.client.ts";

// The shape the shared config declares: a named pattern per sanctioned
// exception, matched against every spelling of the specifier.
const ALLOW_STORAGE = [{ allowImportPatterns: ["(^@/|/src/)server/storage$"] }];

ruleTester.run(
  "no-client-import-of-server-folder",
  noClientImportOfServerFolderRule,
  {
    valid: [
      {
        name: "a client module type-importing a server error class",
        filename: CLIENT_TSX,
        code: `import type { DomainError } from "@/server/errors";\n`,
      },
      {
        name: "a client module re-exporting a server folder type",
        filename: CLIENT_TSX,
        code: `export type { StripeCustomer } from "@/server/stripe";\n`,
      },
      {
        name: "a client module importing a server folder module with inline type specifiers only",
        filename: CLIENT_TSX,
        code: `import { type DomainError } from "@/server/errors";\n`,
      },
      {
        name: "a server module importing the server errors",
        filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
        code: `import { DomainError } from "@/server/errors";\n`,
      },
      {
        name: "a client module importing a path that only starts like the server folder",
        filename: CLIENT_TSX,
        code: `import { toMessage } from "@/server-ui/messages";\n`,
      },
      {
        name: "a client module importing the public asset URL helper from utils",
        filename: CLIENT_TSX,
        code: `import { resolveS3Url } from "@/utils/url/resolve-s3-url";\n`,
      },
      {
        name: "a .client.ts module importing a client-safe utility",
        filename: CLIENT_TS,
        code: `import { formatCents } from "@/utils/string/format-cents";\n`,
      },
      {
        name: "an allowlisted server folder module",
        filename: CLIENT_TSX,
        code: `import { publicAssetUrl } from "@/server/storage";\n`,
        options: ALLOW_STORAGE,
      },
      {
        name: "an allowlisted module reached by its relative spelling",
        filename: CLIENT_TSX,
        code: `import { publicAssetUrl } from "../../../server/storage";\n`,
        options: ALLOW_STORAGE,
      },
    ],
    invalid: [
      {
        name: "a client module importing a server folder module outside the errors bucket",
        filename: CLIENT_TSX,
        code: `import { resolveS3Url } from "@/server/storage/resolve-s3-url";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a client module importing the auth wiring",
        filename: CLIENT_TSX,
        code: `import { auth } from "@/server/auth";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a .client.ts module importing a server folder module",
        filename: CLIENT_TS,
        code: `import { stripe } from "@/server/stripe";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a server folder module outside the allowlist, with an allowlist set",
        filename: CLIENT_TSX,
        code: `import { stripe } from "@/server/stripe";\n`,
        options: ALLOW_STORAGE,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a client module re-exporting a server error class",
        filename: CLIENT_TSX,
        code: `export { DomainError } from "@/server/errors";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a client module star-re-exporting the server errors barrel",
        filename: CLIENT_TSX,
        code: `export * from "@/server/errors";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a client module dynamically importing the server errors barrel",
        filename: CLIENT_TSX,
        code: `const load = () => import("@/server/errors");\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a client module reaching the server folder by relative path",
        filename: CLIENT_TSX,
        code: `import { DomainError } from "../../../server/errors/not-found";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
      {
        name: "a 'use client' module deep-importing a server error class",
        filename: "/repo/apps/web/src/app/_domains/billing/plan-form.tsx",
        code: `"use client";\nimport { NotFoundError } from "@/server/errors/not-found";\n`,
        errors: [{ messageId: "clientImportsServerFolder" }],
      },
    ],
  },
);
