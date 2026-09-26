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
      name: "a single-file feature directly in the features folder",
      filename: "/repo/apps/web/src/app/_features/project-banner.client.tsx",
      code: `export function ProjectBanner() {}\n`,
    },
    {
      name: "a file in a capability folder",
      filename:
        "/repo/apps/web/src/app/_features/project/project-list.client.tsx",
      code: `export function ProjectList() {}\n`,
    },
    {
      name: "a file at <area>/<capability>/ depth",
      filename:
        "/repo/apps/web/src/app/(authenticated)/_features/sidebar/project/project-navigation.client.tsx",
      code: `export function ProjectNavigation() {}\n`,
    },
    {
      name: "a file in a feature nested under a domain",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_features/plan/plan-card.tsx",
      code: `export function PlanCard() {}\n`,
    },
    {
      name: "underscore-prefixed folders do not count toward the depth",
      filename:
        "/repo/apps/web/src/app/_features/sidebar/project/_components/row.tsx",
      code: `export function Row() {}\n`,
    },
    {
      name: "a file outside any feature folder",
      filename: "/repo/apps/web/src/app/(authenticated)/page.tsx",
      code: `export default function Page() {}\n`,
    },
  ],
  invalid: [
    {
      name: "a third capability folder under a features folder",
      filename:
        "/repo/apps/web/src/app/(authenticated)/_features/sidebar/project/create/create-project-dialog.client.tsx",
      code: `export function CreateProjectDialog() {}\n`,
      errors: [{ messageId: "tooDeep" }],
    },
    {
      name: "a third capability folder with an underscore bucket in the path",
      filename:
        "/repo/apps/web/src/app/_features/sidebar/_components/project/create/dialog.tsx",
      code: `export function Dialog() {}\n`,
      errors: [{ messageId: "tooDeep" }],
    },
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
