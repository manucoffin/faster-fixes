import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noFeatureNestingRule } from "./no-feature-nesting.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-feature-nesting", noFeatureNestingRule, {
  valid: [
    {
      name: "a file in a top-level feature",
      filename:
        "/repo/apps/web/src/app/_features/project/project-list.client.tsx",
      code: `export function ProjectList() {}\n`,
    },
    {
      name: "a file in a feature nested under a domain",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_features/plan/plan-card.tsx",
      code: `export function PlanCard() {}\n`,
    },
    {
      name: "a file outside any feature folder",
      filename: "/repo/apps/web/src/app/(authenticated)/page.tsx",
      code: `export default function Page() {}\n`,
    },
  ],
  invalid: [
    {
      name: "a feature directly nested in another feature",
      filename:
        "/repo/apps/web/src/app/_features/project/_features/invite/invite.tsx",
      code: `export function Invite() {}\n`,
      errors: [{ messageId: "nestedFeature" }],
    },
    {
      name: "a feature nested deeper inside another feature",
      filename:
        "/repo/apps/web/src/app/_features/project/_components/_features/invite/invite.tsx",
      code: `export function Invite() {}\n`,
      errors: [{ messageId: "nestedFeature" }],
    },
  ],
});
