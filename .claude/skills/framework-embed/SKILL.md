---
name: framework-embed
description: Checklist for a framework Embed on the closed list in ADR-0016, now complete (React, Vue, Angular, Svelte). Use when rebuilding, auditing or extending one of those packages, or when asked for a new framework package that wraps `@fasterfixes/widget`, which first needs an ADR amendment.
---

ADR-0016 (its 2026-09-28 amendment) is the what and why: the closed list of framework Embeds, one package per rendering runtime, the seven-member control contract, options forwarded unchanged. This skill is the how. The **worked example** is the Vue Embed: `packages/widget-vue`, `examples/vue`, `apps/web/e2e/vue-embed.spec.ts`, `apps/web/src/content/docs/widget/install/vue.mdx`. At every step, open the Vue file first and mirror it; diverge only where the framework's idiom forces it.

Every framework on ADR-0016's closed list has its Embed. A framework outside it needs a new amendment first: stop and ask. The package shape (install entry, accessor name, peer range) is decided with the user before code, since the ADR leaves it open.

`<fw>` below is the framework slug (`vue`, `angular`, `svelte`).

## 1. Package skeleton and metadata

Create `packages/widget-<fw>` from the files of `packages/widget-vue`: `package.json`, `tsdown.config.ts`, `tsconfig.json`, `turbo.json`, `vitest.config.ts`, `eslint.config.js`, `.gitignore`, `LICENSE`.

- `package.json`: name `@fasterfixes/<fw>`, version `0.0.0` (the changeset takes it to 1.0.0), ESM only, `sideEffects: false`, the same `author`, `homepage`, `bugs`, `engines`, `files`, `exports`, `publishConfig`, `repository.directory` set to the new folder, keywords naming the framework and its meta-frameworks.
- Dependencies: `@fasterfixes/widget` at `workspace:^`, nothing else at runtime. Never `@fasterfixes/core` (ADR-0013). The framework is a peer dependency, with a floor set by the oldest version that has every lifecycle hook you use (Vue needs 3.5 for `app.onUnmount`), and a dev dependency for tests.
- `tsdown.config.ts`: the framework in `deps.neverBundle`, so the app's copy is used.
- `.lintstagedrc`: add an ESLint entry for the folder, as for `packages/widget-vue`.
- Adding dependencies is the one deliberate `pnpm install`: check the `pnpm-lock.yaml` diff holds only the new importer before committing.

Done when `pnpm check:packages` is green (build, typecheck, lint, publint on every `@fasterfixes/*` package).

## 2. The contract and its framework mapping

The public API is exactly: an install entry in the framework's idiom, a control accessor, the accessor's return type, and the re-exported `WidgetOptions`, `Labels`, `WidgetPosition`. Compare `packages/widget-vue/src/index.ts`.

| Member                                          | React                          | Vue                            | New Embed                                                    |
| ----------------------------------------------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------ |
| `show`, `hide`, `startAnnotation`, `togglePins` | functions from `useFeedback()` | functions from `useFeedback()` | plain functions delegating to the instance                   |
| `isVisible`, `feedbackItems`, `showPins`        | values, re-render on change    | readonly shallow refs          | the framework's read-only reactive primitive (signal, store) |

Behaviour every Embed carries, each one in the Vue source:

- The option object reaches `init` as the same reference: no renamed keys, no defaults of the wrapper's own, no re-initialisation (`create-faster-fixes.ts`).
- Without `document` (server rendering) nothing is initialised, and the accessor returns the unmounted values: `isVisible: false`, `feedbackItems: []`, `showPins: true`.
- One `subscribe` per app, held with the instance, never one per consumer (`feedback-slot.ts`).
- Teardown on the framework's app-level destroy hook: unsubscribe first, then `destroy()`, because `destroy` drops every listener.
- A second install on the same app is a no-op with a development-only `[faster-fixes]` warning, using the guarded `process.env.NODE_ENV` check (`environment.ts`).
- The accessor called outside the install throws an error naming the missing install call.

## 3. Unit tests

Vitest with jsdom. Mock `@fasterfixes/widget` so `init` returns `createFakeWidget()` from `@fasterfixes/widget/testing`, and assert on its recorded `calls.<method>`, `emit(patch)` and `listenerCount`, never on spies of your own. Cover the contract checklist, one test each, mirroring `create-faster-fixes.test.ts`, `create-faster-fixes.server.test.ts` and `use-feedback.test.ts`:

1. The option object reaches `init` one to one.
2. Server rendering through the framework's server renderer never calls `init` and renders children with the unmounted values.
3. The accessor throws a clear error outside the install.
4. The three state members reflect the instance, and update when the fake emits.
5. The four actions call the instance methods.
6. Destroying the app destroys the instance and leaves `listenerCount` at 0.
7. A second install calls `init` once and warns once in development, never in production.
8. Several consumers share one subscription (`listenerCount` 1) and all update on emit.

Done when all eight pass under `pnpm --filter @fasterfixes/<fw> test`.

## 4. Example app and parity spec

**Example**: `examples/<fw>`, package `@workspace/example-<fw>`, `private: true` (outside the `@fasterfixes/*` filters and Changesets versioning). Mirror `examples/vue`:

- Depends on `@fasterfixes/<fw>` through `workspace:*`; `turbo.json` makes `dev` depend on `^build`; add a root `dev:example-<fw>` script and a `.lintstagedrc` entry.
- Reads `NEXT_PUBLIC_FF_API_KEY` and `NEXT_PUBLIC_FF_API_ORIGIN`, the names Playwright sets, and throws with a hint when the Project ID is missing. Ship `.env.example`.
- A fixed port with `strictPort`, one not taken by another fixture (Vue is 3200, Svelte 3400).
- Page content matching the other fixtures: one `h1`, Home and Second page links reached without a reload, a `#pricing-card` element.
- A control bar calling the four actions and showing `isVisible` and the feedback count under `data-testid="widget-visible"` and `data-testid="feedback-count"`. Button labels avoid the Widget's own accessible names ("Start feedback", "Hide markers", "Show markers", "Submit").

The example is the source of the docs snippets: docs copy from it.

**Parity**, in `apps/web`:

- `e2e/widget-fixtures.ts`: export the example origin, add a `WIDGET_FIXTURES` entry with absolute URLs. Every shared scenario in `widget.spec.ts` then replays against it.
- `playwright.config.ts`: add a `webServer` entry starting the example with the stubbed env, like the Vue one.
- `e2e/<fw>-embed.spec.ts`: the control bar scenario and the labels leak check through `e2e/widget-labels.ts`, mirroring `vue-embed.spec.ts`.

Run `pnpm build:packages` before the suite: the example resolves the Embed from its build. Done when the new fixture passes every scenario in `widget.spec.ts` and the new spec.

## 5. Docs

- `apps/web/src/content/docs/widget/install/<fw>.mdx` with the skeleton of `vue.mdx`: Installation, Setup, Options (with Theming), Where to mount (one subsection per meta-framework, e.g. Analog for Angular, SvelteKit for Svelte, with the root file and any SSR nuance), Next steps.
- `install/meta.json`: the page after the existing framework Embeds, before `script-embed`.
- A card on `widget/overview.mdx` and `getting-started/quickstart.mdx`, and a click-through test for it in `apps/web/e2e/docs.spec.ts`.
- `widget/control-the-widget.mdx`: the framework in the intro sentence, and a tab in every `<Tabs groupId="embed">` block, in closed-list order: React, Vue, Angular, Svelte, then Script embed.
- `widget/install/script-embed.mdx` "Framework apps": point the framework to its install page and drop it from the hand-wired example.
- `widget/customization.mdx`: name the Embed where it lists them.
- Framework lists: `apps/web/src/content/docs/index.mdx`, the homepage FAQ in `apps/web/src/app/(public)/(home)/_features/faq-section.tsx`, `packages/widget/README.md`, and the root `README.md` (npm badge, quick start snippet, packages table, licence line).

Done when `pnpm --filter web build` succeeds and a text search for `@fasterfixes/vue` across `apps/web/src/content`, `README.md` and `packages/widget/README.md` shows the new package beside it everywhere.

## 6. README

`packages/widget-<fw>/README.md` in the layout of `packages/widget-vue/README.md` and nothing more: name, one sentence, npm version and licence badges, Install, a minimal Usage block (install entry plus one accessor call), a link to `/docs/widget/install/<fw>`, Licence.

## 7. Changeset

Use the `release` skill: `@fasterfixes/<fw>: major`, which releases 0.0.0 as 1.0.0, in the voice of `.changeset/vue-embed-1-0-0.md`. Add the package to the `release` skill's package list and `git diff` path list.

## 8. ADR list update

- ADR-0016, the 2026-09-28 amendment: name the new package among those that exist.
- ADR-0013, the 2026-09-28 amendment: name it at layer 2.
- `docs/adr/README.md`: adjust the two index lines if they name the shipped Embeds.
- `CONTEXT.md`, the **Embed** entry: move the framework out of "later".

## Finish

`pnpm lint` and `pnpm format:check` green. Commit one concern per step with the `commit` skill; each commit runs the pre-commit hook.
