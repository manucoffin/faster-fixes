# Testing: where tests live and what to test

The harness is **Vitest** in `apps/web`. The config is a `.ts` file (`vitest.config.ts`) and stays deliberately small:

- `environment: "node"`. There is no browser environment, in line with the scope below.
- `resolve.tsconfigPaths: true`, so `@/*` imports resolve through Vite's native tsconfig paths support. No extra resolver plugin.
- `process.env.TZ = "UTC"`, set at the top of the config module so date assertions resolve the same way on every machine and in CI.
- `include: ["src/**/*.test.{ts,tsx}"]` with `passWithNoTests: true`.
- `resolve.alias` maps `server-only` to `test/server-only-stub.ts`: Node cannot resolve it, so every guarded `src/server` module would fail to load. `src/server/server-only-alias.test.ts` pins the alias.
- `oxc: { jsx: { runtime: "automatic" } }`. The app's tsconfig leaves JSX to Next (`jsx: "preserve"`), so Vite has to be told how to compile the `.tsx` a test loads. **The option is `oxc`, not `esbuild`:** Vitest 5 runs on rolldown-vite, which ignores `esbuild` with a warning that is easy to miss. Reaching for `esbuild` here looks correct and silently does nothing.

Run with `pnpm test` (`vitest run`) or `pnpm test:watch`; it is wired into Turbo as `turbo run test`. Folder buckets are defined in [architecture.md](architecture.md); the data/IO layer in [backend.md](backend.md).

The reference test to copy the shape of is `src/utils/crypto/token-cipher.test.ts`: named cases, one behavior per `it`, environment read through `vi.stubEnv` and cleaned up in `afterEach`.

## Where tests live

Enforced by `local/test-file-placement`: a test whose basename matches no file beside it is reported, and so are a `*.spec.ts(x)` name and a `__tests__/` folder. A structural check (below) has no subject by design and is named in `structuralCheckPathPatterns` in `packages/eslint-config/next.js`.

- **Colocate.** A test sits **next to the file it tests**, same folder, same basename + `.test.ts`: `token-cipher.test.ts` beside `token-cipher.ts`.
- One test file per unit. If a `_services/` file exports one function, its test file tests that function.

## What to test (current scope)

Inside `src/app/`, the layers a test may sit in are enforced by `local/test-file-placement`: `_helpers/`, `_services/` and a route handler's `route.test.ts`. The rest of this section and "The route handler is the third seam" below are **prose only**, apart from where a module mock may point, two sections down.

Keep the surface small and high-value. **Test only pure functions (in `_helpers/`, `src/utils/`, `src/server/`) and dependency-injected `_services/` functions**, plus the two seams below (contract route handlers, structural checks). Nothing else for now.

- **`_helpers/` (pure)**: formatters, label maps, calculators, slug generators, pure predicates. These take inputs and return outputs with no IO, so they are the cheapest and highest-value tests. Prefer testing here.
- **`_services/` (dependency-injected)**: a service that takes its dependencies as explicit parameters (for example `prisma`) is testable by passing a fake or fixture. Test it through that seam. The DI pattern to mirror is `checkFeatureAccess(organizationId, feature, prisma)` under `src/server/auth/subscription/`, which takes `prisma` as a parameter and can be driven with a fake whose `*.findFirst` returns null or an active row.

### The route handler is the third seam

A route handler that serves a contract **someone else already depends on** (the public widget API, the agent API, a registered Tracker webhook) is tested at the handler, not below it. This is the seam module mocks exist for, and it exists because the alternative is no coverage at all for the responses customers parse.

- **Call the exported HTTP method function with a `Request` and assert the `Response`**: status, exact JSON body, headers. 17 `route.test.ts` files under `src/app/api/` do this today; `api/webhooks/github/route.test.ts` is the reference.
- **Fake only infrastructure at the module boundary** (`@workspace/db`, `@/server/inngest`, a provider SDK), never the scope's own services. Nothing asserts which function the route called, in what order, or with what internal shape.
- **Write them before the handler is touched, green against the current code, in their own commit.** They are characterization tests: they record behaviour rather than specify it. An extraction must leave them green **and untouched** — a test that has to change is a broken contract, not a test to update.
- Services extracted behind such a route get no tests of their own. They are covered through the route and can be reshaped freely.

This does not reopen the scope above for ordinary handlers. A route with no external consumer is still covered by testing its helpers and injectable services.

### A module mock sits at a boundary

A test may not mock a module of its own scope. When a collaborator is reached through a singleton rather than through a parameter, the double is registered at a boundary, named by alias or package:

- the database package (`@workspace/db`),
- the server folder (`@/server/...`),
- the lib folder (`@/lib/...`),
- an external package (a provider SDK),
- another domain's barrel (`@/app/_domains/<domain>`).

A relative specifier (`./get-unique-organization-slug`, `../_helpers/...`) is **not** one of them, and `local/no-relative-test-mock` reports it on every `*.test.ts(x)` file. A relative path either pins a sibling the test should be free to reshape, or spells a boundary as if it were local code. The fix is one of two moves: mock the boundary the collaborator itself reaches (`create-organization.test.ts` fakes `@workspace/db` and lets the real slug service run against it), or inject the collaborator as a parameter and pass a fake.

That boundary rule is what every mock in the tree already do, and it is why a `vi.mock` in a service test is not a violation of "no mocking of internals": the module faked is infrastructure, not a neighbour. The rule is not a boundary rule in the not-disableable sense, so a genuine one-off is a disable comment with a reason.

### A structural check is the fourth seam

A convention that holds over the tree rather than inside one module is checked by a test that reads the files, because ESLint sees one file at a time and cannot hold what it learned from the previous one. There are two today. `src/app/_domains/domain-cycles.test.ts` builds the domain dependency graph from every import form under `_domains/` and fails when it finds a cycle, naming the domains in it (ADR-0010). `src/mdx-no-em-dash.test.ts` reads every `.mdx` file of the app (the documentation, the blog, the legal pages) and fails on an em dash, naming the file and the line: the em dash ban is a non-negotiable of the house style, and ESLint cannot parse MDX, so a lint rule over the source reaches none of that copy. The prior art is `packages/eslint-config/local-rules/adr-citations.test.js`.

Such a test sits next to the folder it checks and proves both halves: the scan is exercised on written-out specifiers, and the analysis on planted inputs, so neither can pass because it read nothing.

**Out of scope for now** (do not write tests for these yet): React components and client components, container hooks (`use-*.ts`), tRPC routers and procedures, and any `_services/` function that reaches a singleton (`prisma` imported directly, `next/headers`, `auth.api.*`) instead of receiving its deps. If a piece of logic is worth testing but is trapped behind one of these, extract it down into a pure `_helpers/` function or a dependency-injected `_services/` function and test it there.

Because component tests are out of scope, the harness carries no DOM tooling. `jsdom` and `@testing-library/react` are added the day the first component test exists, not before.

## End-to-end specs: the Widget in a real browser

The Widget is the one piece of UI with an end-to-end suite, because it runs on pages the app does not own and its contract is what a customer's page sees. The harness is **Playwright**, in `apps/web/e2e/`, run with `pnpm --filter web test:e2e` (CI job "Widget end to end"). `apps/web/playwright.config.ts` starts `next dev` on port 3100 with placeholder env values, so the suite needs no database and no `.env`. Stop your own `next dev` in `apps/web` first: Next.js refuses a second dev server for the same directory.

- **Placement, enforced by `local/test-file-placement`:** specs live in the workspace `e2e/` folder and are named `*.spec.ts`, the one place that name is right. A `*.test.ts` there is reported, since Playwright collects specs only and Vitest only reads `src/`. Support modules sit beside the specs under ordinary names.
- **No backend.** `e2e/widget-api-stub.ts` answers every widget HTTP API endpoint by route interception on an unresolvable origin (`NEXT_PUBLIC_FF_API_ORIGIN`), with bodies shaped like the real handlers, and records each request for assertions. A request the stub misses fails rather than reaching a server. The app's own session request is answered in the spec for the same reason.
- **One scenario, every fixture.** A fixture is a page that installs the Widget, listed in `e2e/widget-fixtures.ts`. `widget.spec.ts` loops over the list, so a new Embed is covered by adding an entry, never by copying a scenario.
- **Assert what a Reviewer or the customer's page observes:** the DOM by role and accessible name, `localStorage`, the address bar and the stubbed requests. The same "good test" rules below apply.

## What makes a good test

**Prose only**, no rule, apart from the mock boundary already covered by `local/no-relative-test-mock`.

- Test **external behavior at the highest seam**, feed data in, assert data out. Never assert on internals or implementation details.
- **No mocking of internals.** Inject dependencies as plain fakes or fixtures through the function's parameters; don't reach for module mocks. Where a module mock is unavoidable, it sits at a boundary ("A module mock sits at a boundary" above).
- Cover the meaningful states (empty / partial / full, allowed / denied, present / missing), not just the happy path.
