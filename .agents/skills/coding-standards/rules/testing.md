# Testing: where tests live and what to test

The harness is **Vitest** in `apps/web`. The config is a `.ts` file (`vitest.config.ts`) and stays deliberately small:

- `environment: "node"`. There is no browser environment, in line with the scope below.
- `resolve.tsconfigPaths: true`, so `@/*` imports resolve through Vite's native tsconfig paths support. No extra resolver plugin.
- `process.env.TZ = "UTC"`, set at the top of the config module so date assertions resolve the same way on every machine and in CI.
- `include: ["src/**/*.test.{ts,tsx}"]` with `passWithNoTests: true`.
- `oxc: { jsx: { runtime: "automatic" } }`. The app's tsconfig leaves JSX to Next (`jsx: "preserve"`), so Vite has to be told how to compile the `.tsx` a test loads. **The option is `oxc`, not `esbuild`:** Vitest 5 runs on rolldown-vite, which ignores `esbuild` with a warning that is easy to miss. Reaching for `esbuild` here looks correct and silently does nothing.

Run with `pnpm test` (`vitest run`) or `pnpm test:watch`; it is wired into Turbo as `turbo run test`. Folder buckets are defined in [architecture.md](architecture.md); the data/IO layer in [backend.md](backend.md).

The reference test to copy the shape of is `src/utils/crypto/token-cipher.test.ts`: named cases, one behavior per `it`, environment read through `vi.stubEnv` and cleaned up in `afterEach`.

## Where tests live

- **Colocate.** A test sits **next to the file it tests**, same folder, same basename + `.test.ts`: `token-cipher.test.ts` beside `token-cipher.ts`.
- One test file per unit. If a `_services/` file exports one function, its test file tests that function.

## What to test (current scope)

Keep the surface small and high-value. **Test only pure `_helpers/` functions and dependency-injected `_services/` functions.** Nothing else for now.

- **`_helpers/` (pure)**: formatters, label maps, calculators, slug generators, pure predicates. These take inputs and return outputs with no IO, so they are the cheapest and highest-value tests. Prefer testing here.
- **`_services/` (dependency-injected)**: a service that takes its dependencies as explicit parameters (for example `prisma`) is testable by passing a fake or fixture. Test it through that seam. The DI pattern to mirror is `checkFeatureAccess(organizationId, feature, prisma)` under `src/server/auth/subscription/`, which takes `prisma` as a parameter and can be driven with a fake whose `*.findFirst` returns null or an active row.

### The route handler is the third seam

A route handler that serves a contract **someone else already depends on** (the public widget API, the agent API, a registered Tracker webhook) is tested at the handler, not below it. This is the one seam where module mocks are correct, and it exists because the alternative is no coverage at all for the responses customers parse.

- **Call the exported HTTP method function with a `Request` and assert the `Response`**: status, exact JSON body, headers. 17 `route.test.ts` files under `src/app/api/` do this today; `api/webhooks/github/route.test.ts` is the reference.
- **Fake only infrastructure at the module boundary** (`@workspace/db`, `@/server/inngest`, a provider SDK), never the scope's own services. Nothing asserts which function the route called, in what order, or with what internal shape.
- **Write them before the handler is touched, green against the current code, in their own commit.** They are characterization tests: they record behaviour rather than specify it. An extraction must leave them green **and untouched** — a test that has to change is a broken contract, not a test to update.
- Services extracted behind such a route get no tests of their own. They are covered through the route and can be reshaped freely.

This does not reopen the scope above for ordinary handlers. A route with no external consumer is still covered by testing its helpers and injectable services.

**Out of scope for now** (do not write tests for these yet): React components and client components, container hooks (`use-*.ts`), tRPC routers and procedures, and any `_services/` function that reaches a singleton (`prisma` imported directly, `next/headers`, `auth.api.*`) instead of receiving its deps. If a piece of logic is worth testing but is trapped behind one of these, extract it down into a pure `_helpers/` function or a dependency-injected `_services/` function and test it there.

Because component tests are out of scope, the harness carries no DOM tooling. `jsdom` and `@testing-library/react` are added the day the first component test exists, not before.

## What makes a good test

- Test **external behavior at the highest seam**, feed data in, assert data out. Never assert on internals or implementation details.
- **No mocking of internals.** Inject dependencies as plain fakes or fixtures through the function's parameters; don't reach for module mocks. The route-handler seam above is the single exception, and even there only infrastructure modules are faked.
- Cover the meaningful states (empty / partial / full, allowed / denied, present / missing), not just the happy path.
