import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noRelativeTestMockRule } from "./no-relative-test-mock.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

const SERVICE_TEST =
  "/repo/apps/web/src/app/_domains/organization/_services/create-organization.test.ts";
const ROUTE_TEST = "/repo/apps/web/src/app/api/v1/feedback/route.test.ts";

ruleTester.run("no-relative-test-mock", noRelativeTestMockRule, {
  valid: [
    {
      name: "the database package",
      filename: ROUTE_TEST,
      code: `vi.mock("@workspace/db", () => ({ prisma: {} }));\n`,
    },
    {
      name: "the server folder",
      filename: SERVICE_TEST,
      code: `vi.mock("@/server/auth/subscription", () => ({}));\n`,
    },
    {
      name: "the lib folder",
      filename: SERVICE_TEST,
      code: `vi.mock("@/lib/mailer/client", () => ({}));\n`,
    },
    {
      name: "an external package",
      filename: ROUTE_TEST,
      code: `vi.mock("@better-upload/server/helpers", () => ({}));\n`,
    },
    {
      name: "another domain's barrel",
      filename: SERVICE_TEST,
      code: `vi.mock("@/app/_domains/subscription", () => ({}));\n`,
    },
    {
      name: "a relative import, which is the module under test rather than a double of it",
      filename: SERVICE_TEST,
      code: `const { createOrganization } = await import("./create-organization");\n`,
    },
    {
      name: "a relative specifier passed to something that is not a vi mock call",
      filename: SERVICE_TEST,
      code: `expect.addSnapshotSerializer("./serializer");\n`,
    },
    {
      name: "a mock with no specifier to read",
      filename: SERVICE_TEST,
      code: `vi.mock(specifier, () => ({}));\n`,
    },
  ],
  invalid: [
    {
      name: "a sibling of the module under test",
      filename: SERVICE_TEST,
      code: `vi.mock("./get-unique-organization-slug", () => ({}));\n`,
      errors: [{ messageId: "relativeMock" }],
    },
    {
      name: "the module under test itself",
      filename: SERVICE_TEST,
      code: `vi.mock("./create-organization");\n`,
      errors: [{ messageId: "relativeMock" }],
    },
    {
      name: "a module of the scope above, reached by walking up",
      filename: SERVICE_TEST,
      code: `vi.mock("../_helpers/format-slug", () => ({}));\n`,
      errors: [{ messageId: "relativeMock" }],
    },
    {
      name: "the type-safe `vi.mock(import(...))` form",
      filename: SERVICE_TEST,
      code: `vi.mock(import("./get-unique-organization-slug"), () => ({}));\n`,
      errors: [{ messageId: "relativeMock" }],
    },
    {
      name: "the deferred `vi.doMock` form",
      filename: SERVICE_TEST,
      code: `vi.doMock("./get-unique-organization-slug", () => ({}));\n`,
      errors: [{ messageId: "relativeMock" }],
    },
    {
      name: "an unmock, which only follows a mock of the same module",
      filename: SERVICE_TEST,
      code: `vi.unmock("./get-unique-organization-slug");\n`,
      errors: [{ messageId: "relativeMock" }],
    },
    {
      name: "a boundary module reached by walking up the tree rather than by its alias",
      filename: SERVICE_TEST,
      code: `vi.mock("../../../../server/auth/subscription", () => ({}));\n`,
      errors: [{ messageId: "relativeMock" }],
    },
  ],
});
