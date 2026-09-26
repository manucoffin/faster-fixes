import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { appFilePlacementRule } from "./app-file-placement.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

const APP = "/repo/apps/web/src/app";
const CODE = "export const x = 1;\n";

ruleTester.run("app-file-placement", appFilePlacementRule, {
  valid: [
    {
      name: "a service in a domain _services/",
      filename: `${APP}/_domains/project/_services/get-project.ts`,
      code: CODE,
    },
    {
      name: "a provider subfolder inside a domain bucket (ADR-0014)",
      filename: `${APP}/_domains/integration/_services/jira/token-access.ts`,
      code: CODE,
    },
    {
      name: "a helper in a nested route segment",
      filename: `${APP}/(authenticated)/(project)/inbox/_helpers/format-page-url.ts`,
      code: CODE,
    },
    {
      name: "a service under an API route segment",
      filename: `${APP}/api/v1/agent/feedbacks/_services/list-feedbacks.ts`,
      code: CODE,
    },
    {
      name: "a domain-agnostic bucket at the app root",
      filename: `${APP}/_providers/theme-provider.client.tsx`,
      code: CODE,
    },
    {
      name: "a sub-library of the root _components/",
      filename: `${APP}/_components/dashboard/breadcrumbs.client.tsx`,
      code: CODE,
    },
    {
      name: "a capability folder at the domain root (ADR-0010 amendment)",
      filename: `${APP}/_domains/subscription/plan-gate/use-plan-gate.ts`,
      code: CODE,
    },
    {
      name: "a sub-bucket inside a domain capability folder",
      filename: `${APP}/_domains/subscription/plan-card/_components/plan-price.tsx`,
      code: CODE,
    },
    {
      name: "a feature-internal sub-bucket, grown on demand (ADR-0011)",
      filename: `${APP}/(authenticated)/_features/sidebar/_hooks/use-sidebar.ts`,
      code: CODE,
    },
    {
      name: "a domain barrel",
      filename: `${APP}/_domains/feedback/index.ts`,
      code: CODE,
    },
    {
      name: "trpc-router at a domain root",
      filename: `${APP}/_domains/auth/trpc-router.ts`,
      code: CODE,
    },
    {
      name: "trpc-router beside a route page",
      filename: `${APP}/(authenticated)/organization/trpc-router.ts`,
      code: CODE,
    },
    {
      name: "a schema in _services/",
      filename: `${APP}/(authenticated)/organization/_services/create-invitation.schema.ts`,
      code: CODE,
    },
    {
      name: "a server component outside _services/",
      filename: `${APP}/(public)/_components/header.server.tsx`,
      code: CODE,
    },
    {
      name: "a server action keeps its required suffix",
      filename: `${APP}/_domains/auth/_services/sign-out.server.action.ts`,
      code: CODE,
    },
    {
      name: "a structural test directly in _domains/ is left to test-file-placement",
      filename: `${APP}/_domains/domain-cycles.test.ts`,
      code: CODE,
    },
    {
      name: "a retired _deprecated_ folder",
      filename: `${APP}/_domains/project/_deprecated_utils/format.ts`,
      code: CODE,
    },
    {
      name: "a Next.js special file at a route segment",
      filename: `${APP}/(public)/blog/[slug]/page.tsx`,
      code: CODE,
    },
    {
      name: "files outside src/app are ignored",
      filename: "/repo/apps/web/src/server/_utils/thing.schema.ts",
      code: CODE,
    },
  ],
  invalid: [
    {
      name: "a _utils/ bucket in a domain (retired by ADR-0011)",
      filename: `${APP}/_domains/project/_utils/format.ts`,
      code: CODE,
      errors: [{ messageId: "unknownBucket" }],
    },
    {
      name: "a _hooks/ bucket in a route scope",
      filename: `${APP}/(authenticated)/account/_hooks/use-account.ts`,
      code: CODE,
      errors: [{ messageId: "unknownBucket" }],
    },
    {
      name: "a scope bucket at the app root",
      filename: `${APP}/_helpers/format-date.ts`,
      code: CODE,
      errors: [{ messageId: "unknownBucket" }],
    },
    {
      name: "an underscore folder under _domains/",
      filename: `${APP}/_domains/_shared/thing.ts`,
      code: CODE,
      errors: [{ messageId: "notADomainFolder" }],
    },
    {
      name: "a bucket inside a bucket",
      filename: `${APP}/_domains/project/_services/_types/project-row.ts`,
      code: CODE,
      errors: [{ messageId: "bucketInBucket" }],
    },
    {
      name: "a bucket inside a root bucket",
      filename: `${APP}/_components/_helpers/cn.ts`,
      code: CODE,
      errors: [{ messageId: "bucketInBucket" }],
    },
    {
      name: "a loose file directly in _domains/",
      filename: `${APP}/_domains/shared-constants.ts`,
      code: CODE,
      errors: [{ messageId: "looseDomainsFile" }],
    },
    {
      name: "a loose file at a domain root",
      filename: `${APP}/_domains/project/project-limits.ts`,
      code: CODE,
      errors: [{ messageId: "looseDomainRootFile" }],
    },
    {
      name: "a trpc-router inside _services/",
      filename: `${APP}/_domains/project/_services/trpc-router.ts`,
      code: CODE,
      errors: [{ messageId: "routerOutsideScopeRoot" }],
    },
    {
      name: "a trpc-router inside a route feature",
      filename: `${APP}/(authenticated)/_features/sidebar/trpc-router.ts`,
      code: CODE,
      errors: [{ messageId: "routerOutsideScopeRoot" }],
    },
    {
      name: "a trpc-router inside a domain capability folder",
      filename: `${APP}/_domains/subscription/plan-gate/trpc-router.ts`,
      code: CODE,
      errors: [{ messageId: "routerOutsideScopeRoot" }],
    },
    {
      name: "a schema in a feature",
      filename: `${APP}/(authenticated)/_features/sidebar/create-project.schema.ts`,
      code: CODE,
      errors: [{ messageId: "schemaOutsideServices" }],
    },
    {
      name: "a schema at a route root",
      filename: `${APP}/(public)/contact/contact.schema.ts`,
      code: CODE,
      errors: [{ messageId: "schemaOutsideServices" }],
    },
    {
      name: "a .server.query role suffix on a service",
      filename: `${APP}/_domains/project/_services/get-project.server.query.ts`,
      code: CODE,
      errors: [
        {
          messageId: "retiredRoleSuffix",
          data: { suffix: ".server.query", suggested: "get-project.ts" },
        },
      ],
    },
    {
      name: "a .trpc.mutation role suffix outside _services/",
      filename: `${APP}/(authenticated)/_features/sidebar/create-project.trpc.mutation.ts`,
      code: CODE,
      errors: [
        {
          messageId: "retiredRoleSuffix",
          data: { suffix: ".trpc.mutation", suggested: "create-project.ts" },
        },
      ],
    },
    {
      name: "a sub-library nested in a sub-library",
      filename: `${APP}/_components/seo/schemas/faq-schema.tsx`,
      code: CODE,
      errors: [
        { messageId: "nestedComponentLibrary", data: { library: "seo" } },
      ],
    },
    {
      name: "a folder named after the single component it wraps",
      filename: `${APP}/(public)/_components/footer/footer.tsx`,
      code: CODE,
      errors: [{ messageId: "componentWrapperFolder" }],
    },
  ],
});
