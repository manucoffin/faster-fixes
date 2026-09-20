import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noRestrictedPatternsRule } from "./no-restricted-patterns.js";

RuleTester.describe = describe;
RuleTester.it = it;

// Two of the three patterns are TypeScript syntax, so the TS parser is
// required for the whole suite.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const HELPER =
  "/repo/apps/web/src/app/_domains/subscription/_helpers/subscription-plans.ts";
const FEATURE =
  "/repo/apps/web/src/app/(authenticated)/(project)/inbox/_features/inbox-tabs.client.tsx";
const SERVICE_TEST =
  "/repo/apps/web/src/app/(authenticated)/integrations/_services/list-agent-tokens.test.ts";

// The wiring the shared config passes: a test builds a partial Prisma double
// and can only reach the client type through the widening step.
const TEST_DOUBLE_OPTIONS = [
  { allowDoubleCastPathPatterns: ["\\.test\\.tsx?$"] },
];

ruleTester.run("no-restricted-patterns", noRestrictedPatternsRule, {
  valid: [
    {
      name: "the `as const` object and union type that replace an enum",
      filename: HELPER,
      code: `export const PlanName = { Free: "free", Pro: "pro" } as const;\nexport type PlanName = (typeof PlanName)[keyof typeof PlanName];\n`,
    },
    {
      name: "a single cast, which the compiler still checks",
      filename: HELPER,
      code: `export const id = raw as string;\n`,
    },
    {
      name: "a double cast in a test file, where the double is partial on purpose",
      filename: SERVICE_TEST,
      options: TEST_DOUBLE_OPTIONS,
      code: `const db = { member: { findFirst: vi.fn() } } as unknown as FakeDb;\n`,
    },
    {
      name: "a query guarded by `matchQueryStatus`, whose success data needs no fallback",
      filename: FEATURE,
      code: `export const view = matchQueryStatus(teamsQuery, {\n  Success: ({ data: teams }) => <Picker teams={teams ?? []} />,\n});\n`,
    },
    {
      name: "an empty-array fallback on a lookup rather than on a read",
      filename: FEATURE,
      code: `export const items = grouped[columnId] ?? [];\n`,
    },
    {
      name: "a count read off the query data, which keeps the error state distinct",
      filename: FEATURE,
      code: `export const count = invitationsQuery.data?.length ?? 0;\n`,
    },
  ],
  invalid: [
    {
      name: "a TypeScript enum",
      filename: HELPER,
      code: `export enum PlanName {\n  Free = "free",\n}\n`,
      errors: [{ messageId: "noEnum" }],
    },
    {
      name: "an `as unknown as` double cast outside a test",
      filename: HELPER,
      code: `const id = window.setTimeout(tick, 16) as unknown as number;\n`,
      errors: [{ messageId: "noDoubleCast" }],
    },
    {
      name: "the same double cast spelled through `any`",
      filename: HELPER,
      code: `const id = handle as any as number;\n`,
      errors: [{ messageId: "noDoubleCast" }],
    },
    {
      name: "an empty-array fallback on a query result",
      filename: FEATURE,
      code: `export const pageUrls = pageUrlsQuery.data ?? [];\n`,
      errors: [{ messageId: "noEmptyArrayFallback" }],
    },
    {
      name: "the same fallback on an optional chain",
      filename: FEATURE,
      code: `export const pageUrls = pageUrlsQuery?.data ?? [];\n`,
      errors: [{ messageId: "noEmptyArrayFallback" }],
    },
    {
      name: "a test file still held to the other two patterns",
      filename: SERVICE_TEST,
      options: TEST_DOUBLE_OPTIONS,
      code: `enum Role {\n  Owner = "owner",\n}\n`,
      errors: [{ messageId: "noEnum" }],
    },
  ],
});
