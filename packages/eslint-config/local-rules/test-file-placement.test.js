import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";

import { testFilePlacementRule } from "./test-file-placement.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

// The rule reads the subject from disk, so the subjects are real files in a
// throwaway tree. Test files themselves need not exist: ESLint lints the code
// it is given under the filename it is told.
const root = mkdtempSync(join(tmpdir(), "test-file-placement-"));
const SRC = join(root, "apps/web/src").replace(/\\/g, "/");
const APP = `${SRC}/app`;

const SUBJECTS = [
  `${APP}/_domains/project/_helpers/is-allowed-origin.ts`,
  `${APP}/(authenticated)/_services/send-feedback.ts`,
  `${APP}/api/webhooks/github/route.ts`,
  `${APP}/(authenticated)/_features/sidebar/use-sidebar.ts`,
  `${APP}/_domains/project/trpc-router.ts`,
  `${SRC}/utils/crypto/token-cipher.ts`,
];
for (const subject of SUBJECTS) {
  mkdirSync(dirname(subject), { recursive: true });
  writeFileSync(subject, "export {};\n");
}

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const CODE = "export {};\n";
const STRUCTURAL = [
  { structuralCheckPathPatterns: ["/domain-cycles\\.test\\.ts$"] },
];

ruleTester.run("test-file-placement", testFilePlacementRule, {
  valid: [
    {
      name: "a helper test beside its helper",
      filename: `${APP}/_domains/project/_helpers/is-allowed-origin.test.ts`,
      code: CODE,
    },
    {
      name: "a .tsx service test beside a .ts service",
      filename: `${APP}/(authenticated)/_services/send-feedback.test.tsx`,
      code: CODE,
    },
    {
      name: "a contract route handler test beside its route",
      filename: `${APP}/api/webhooks/github/route.test.ts`,
      code: CODE,
    },
    {
      name: "a test outside src/app beside its subject",
      filename: `${SRC}/utils/crypto/token-cipher.test.ts`,
      code: CODE,
    },
    {
      name: "a structural check named in the options",
      filename: `${APP}/_domains/domain-cycles.test.ts`,
      code: CODE,
      options: STRUCTURAL,
    },
    {
      name: "a non-test module is ignored",
      filename: `${APP}/_domains/project/_helpers/is-allowed-origin.ts`,
      code: CODE,
    },
  ],
  invalid: [
    {
      name: "a test whose subject was renamed away",
      filename: `${APP}/_domains/project/_helpers/is-allowed-host.test.ts`,
      code: CODE,
      errors: [
        { messageId: "missingSubject", data: { subject: "is-allowed-host" } },
      ],
    },
    {
      name: "a behaviour-named test outside src/app",
      filename: `${SRC}/utils/crypto/round-trip.test.ts`,
      code: CODE,
      errors: [{ messageId: "missingSubject" }],
    },
    {
      name: "a structural check the options do not name",
      filename: `${APP}/_domains/domain-cycles.test.ts`,
      code: CODE,
      errors: [
        { messageId: "missingSubject" },
        { messageId: "outsideTestableLayer" },
      ],
    },
    {
      name: "a container hook test in a feature",
      filename: `${APP}/(authenticated)/_features/sidebar/use-sidebar.test.ts`,
      code: CODE,
      errors: [{ messageId: "outsideTestableLayer" }],
    },
    {
      name: "a router test",
      filename: `${APP}/_domains/project/trpc-router.test.ts`,
      code: CODE,
      errors: [{ messageId: "outsideTestableLayer" }],
    },
    {
      name: "a spec file the harness never collects",
      filename: `${APP}/_domains/project/_helpers/is-allowed-origin.spec.ts`,
      code: CODE,
      errors: [
        {
          messageId: "specName",
          data: { suggested: "is-allowed-origin.test.ts" },
        },
      ],
    },
    {
      name: "a test in a __tests__/ folder",
      filename: `${APP}/_domains/project/_helpers/__tests__/is-allowed-origin.test.ts`,
      code: CODE,
      errors: [{ messageId: "testsFolder" }],
    },
  ],
});
