import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noCrossDomainDeepImportRule } from "./no-cross-domain-deep-import.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-cross-domain-deep-import", noCrossDomainDeepImportRule, {
  valid: [
    {
      name: "another domain imported through its public index",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "@/app/_domains/project";\n`,
    },
    {
      name: "a deep import inside the importer's own domain",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getPlan } from "@/app/_domains/billing/_services/get-plan";\n`,
    },
    {
      name: "a deep cross-domain import from outside any domain",
      filename: "/repo/apps/web/src/app/(authenticated)/page.tsx",
      code: `import { getPlan } from "@/app/_domains/billing/_services/get-plan";\n`,
    },
    {
      name: "a relative import inside the domain",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getPlan } from "./_services/get-plan";\n`,
    },
    {
      name: "a relative import that climbs and comes back down inside the domain",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { PLANS } from "../_constants/plans";\n`,
    },
    {
      name: "a relative import that climbs twice and comes back down inside the domain",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/plan/get-plan.ts",
      code: `import { PLANS } from "../../_constants/plans";\n`,
    },
    {
      name: "a relative import that leaves _domains for a shared component",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `import { Logo } from "../../_components/logo";\n`,
    },
    {
      name: "a relative deep import from a route outside _domains",
      filename: "/repo/apps/web/src/app/(authenticated)/billing/page.tsx",
      code: `import { getPlan } from "../../_domains/billing/_services/get-plan";\n`,
    },
    {
      name: "a relative deep import from src/server",
      filename: "/repo/apps/web/src/server/stripe/sync-subscription.ts",
      code: `import { getPlan } from "../../app/_domains/billing/_services/get-plan";\n`,
    },
    {
      name: "an export from another domain's barrel alias",
      filename: "/repo/apps/web/src/app/_domains/billing/index.ts",
      code: `export { getProject } from "@/app/_domains/project";\n`,
    },
    {
      name: "an export from a module of the importer's own domain",
      filename: "/repo/apps/web/src/app/_domains/billing/index.ts",
      code: `export * from "./_services/get-plan";\n`,
    },
    {
      name: "a package whose name only starts like the domains alias",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { x } from "@/app/_domains-legacy/project/thing";\n`,
    },
    {
      name: "an export declaration without a source",
      filename: "/repo/apps/web/src/app/_domains/billing/index.ts",
      code: `const plan = 1;\nexport { plan };\n`,
    },
  ],
  invalid: [
    {
      name: "a deep import into another domain's services",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "@/app/_domains/project/_services/get-project";\n`,
      errors: [{ messageId: "crossDomainDeep" }],
    },
    {
      name: "a deep import into another domain's one-level child",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { projectSchema } from "@/app/_domains/project/project.schema";\n`,
      errors: [{ messageId: "crossDomainDeep" }],
    },
    {
      name: "a relative import into another domain's internals",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "../project/_services/get-project";\n`,
      errors: [{ messageId: "crossDomainRelative" }],
    },
    {
      name: "a relative import that climbs out of a nested folder into another domain",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { projectSchema } from "../../project/project.schema";\n`,
      errors: [{ messageId: "crossDomainRelative" }],
    },
    {
      name: "a relative import of another domain's barrel folder",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "../project";\n`,
      errors: [{ messageId: "crossDomainRelative" }],
    },
    {
      name: "a relative import of another domain's barrel file",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "../project/index";\n`,
      errors: [{ messageId: "crossDomainRelative" }],
    },
    {
      name: "a named re-export of another domain's deep path",
      filename: "/repo/apps/web/src/app/_domains/billing/index.ts",
      code: `export { getProject } from "@/app/_domains/project/_services/get-project";\n`,
      errors: [{ messageId: "crossDomainDeep" }],
    },
    {
      name: "a star re-export of another domain's deep path",
      filename: "/repo/apps/web/src/app/_domains/billing/index.ts",
      code: `export * from "@/app/_domains/project/_services/get-project";\n`,
      errors: [{ messageId: "crossDomainDeep" }],
    },
    {
      name: "a relative star re-export of another domain's deep path",
      filename: "/repo/apps/web/src/app/_domains/billing/index.ts",
      code: `export * from "../project/_services/get-project";\n`,
      errors: [{ messageId: "crossDomainRelative" }],
    },
  ],
});
