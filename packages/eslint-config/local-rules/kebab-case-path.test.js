import path from "node:path";

import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { kebabCasePathRule } from "./kebab-case-path.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

// The tester lints with the process working directory as `context.cwd`, so a
// path under it is one the rule checks.
const inCwd = (relative) => path.join(process.cwd(), relative);

const CODE = `export const value = 1;\n`;

ruleTester.run("kebab-case-path", kebabCasePathRule, {
  valid: [
    {
      name: "kebab-case folders and file",
      filename: inCwd("src/app/_domains/user-profile/user-card.tsx"),
      code: CODE,
    },
    {
      name: "dot-separated parts of a name",
      filename: inCwd("src/app/_features/create-user.schema.ts"),
      code: CODE,
    },
    {
      name: "a client suffix and a test suffix",
      filename: inCwd("src/lib/domain-cycles.test.ts"),
      code: CODE,
    },
    {
      name: "digits in a name",
      filename: inCwd("src/app/api/v1/404.tsx"),
      code: CODE,
    },
    {
      name: "a leading underscore on a bucket and on a private file",
      filename: inCwd("src/app/_services/_app.ts"),
      code: CODE,
    },
    {
      name: "a dynamic segment with a camelCase param",
      filename: inCwd("src/app/projects/[projectId]/page.tsx"),
      code: CODE,
    },
    {
      name: "catch-all and optional catch-all segments",
      filename: inCwd("src/app/docs/[...slug]/blog/[[...slug]]/page.tsx"),
      code: CODE,
    },
    {
      name: "a route group and a parallel route slot",
      filename: inCwd("src/app/(authenticated)/@modal/page.tsx"),
      code: CODE,
    },
    {
      name: "intercepting routes",
      filename: inCwd("src/app/(.)photo/(..)feed/(...)user-card/page.tsx"),
      code: CODE,
    },
    {
      name: "an intercepted dynamic segment",
      filename: inCwd("src/app/(..)[id]/page.tsx"),
      code: CODE,
    },
    {
      name: "a deprecated stub, whatever its casing",
      filename: inCwd("src/app/_deprecated_UserCard.tsx"),
      code: CODE,
    },
    {
      name: "a dotfile",
      filename: inCwd(".storybook/main.ts"),
      code: CODE,
    },
    {
      name: "a file under node_modules",
      filename: inCwd("node_modules/SomePackage/Index.js"),
      code: CODE,
    },
    {
      name: "a file outside the working directory",
      filename: "/Elsewhere/SomeFolder/UserCard.tsx",
      code: CODE,
    },
  ],
  invalid: [
    {
      name: "a PascalCase file",
      filename: inCwd("src/app/_components/UserCard.tsx"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: { segment: "UserCard.tsx", suggestion: "user-card.tsx" },
        },
      ],
    },
    {
      name: "a camelCase folder",
      filename: inCwd("src/app/userProfile/page.tsx"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: { segment: "userProfile", suggestion: "user-profile" },
        },
      ],
    },
    {
      name: "a snake_case part after a dot",
      filename: inCwd("src/lib/create-user.input_schema.ts"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: {
            segment: "create-user.input_schema.ts",
            suggestion: "create-user.input-schema.ts",
          },
        },
      ],
    },
    {
      name: "a bucket whose name after the underscore is not kebab-case",
      filename: inCwd("src/app/_sharedComponents/row.tsx"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: {
            segment: "_sharedComponents",
            suggestion: "_shared-components",
          },
        },
      ],
    },
    {
      name: "an intercepted segment whose name is not kebab-case",
      filename: inCwd("src/app/(.)PhotoModal/page.tsx"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: { segment: "(.)PhotoModal", suggestion: "(.)photo-modal" },
        },
      ],
    },
    {
      name: "an acronym in a file name",
      filename: inCwd("src/lib/HTTPClient.ts"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: { segment: "HTTPClient.ts", suggestion: "http-client.ts" },
        },
      ],
    },
    {
      name: "one report per file, naming the first offending segment",
      filename: inCwd("src/FooBar/BazQux.ts"),
      code: CODE,
      errors: [
        {
          messageId: "notKebabCase",
          data: { segment: "FooBar", suggestion: "foo-bar" },
        },
      ],
    },
  ],
});
