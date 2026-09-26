# Step 1: Tooling

> End state: the project carries the coding-standards skill, agent instructions that point to it, the custom ESLint rules wired at `warn` behind an agent gate, the test harness conventions, and the required-checks commands. No application code changes in this step.

Read `docs/architecture.md` (the target architecture) first. This step makes every later step verifiable.

## Goal

After this step, an agent working in the repo:

- loads the `coding-standards` skill before writing code and finds the rule that applies;
- can run `pnpm lint:agent-rules` and see every convention violation as a warning, scoped by rule;
- can run `pnpm typecheck`, `pnpm lint`, `pnpm test` and knows all three must pass before declaring work done.

## Target state

### Skill

```
.agents/skills/coding-standards/
├── SKILL.md              # router table: "you are about to..." -> rule file
└── rules/
    ├── architecture.md
    ├── backend.md
    ├── naming.md
    ├── schemas.md
    ├── frontend.md
    ├── errors.md
    ├── typescript.md
    ├── testing.md
    └── code-shape.md
.claude/skills/coding-standards -> ../../.agents/skills/coding-standards
```

Adaptations to the copied files:

- `rules/frontend.md`: replace the "French tutoiement, no em dash" copy rule with the project's own user-facing language rule (English). Keep everything else.
- `rules/testing.md`: the harness paths must match the project's Vitest setup (config file name, setup file, aliases).
- `rules/architecture.md`, `rules/backend.md`, `rules/errors.md`: replace the `docs/adr/00xx-...` authority links with the project's own ADR paths once the ADRs from the kit are committed there (steps 2 to 5). Until then, leave the links pointing at the kit's `adrs/` files.
- Any mention of Kilpi, `safe-action`, subscription procedures, or cache tags is removed or marked as not applicable.

The other skills listed in the kit README are copied as-is.

### Agent instructions

`AGENTS.md` at the repo root, symlinked as `CLAUDE.md`, contains at least:

- **Critical conventions**: "All coding standards live in the `coding-standards` skill. Load it before writing, refactoring, or reviewing code."
- **Required checks before done**: `pnpm typecheck`, `pnpm lint`, `pnpm lint:agent-rules`. Never declare completion while one fails.
- **Non-negotiables** that survive the language change: never delete files (retire with an empty `_deprecated_*` stub), never edit `.env*`, identifiers and comments in English, use canonical glossary terms.
- **Keep costs low**: reuse patterns in touched folders, keep edits scoped, prefer enforceable rules over prompt text.

### ESLint

```
packages/eslint-config/
├── package.json          # exports ./base, ./next-js; scripts test, test:watch (vitest)
├── base.js
├── next.js               # wires the local plugin, severities, and the agent gate
└── local-rules/
    ├── index.js          # exports localRulesPlugin with the 13 rules below
    ├── *.js              # one file per rule
    └── *.test.js         # rule tests
```

Rules present in `index.js` under the `local/` namespace:

| Rule                                | Files glob                          | Severity in this step                                                  |
| ----------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `services-verb-prefix`              | `**/_services/**/*.{ts,tsx}`        | `warn` (agent)                                                         |
| `services-no-trpc-import`           | `**/_services/**/*.{ts,tsx}`        | `warn` (agent)                                                         |
| `require-trpc-output-type`          | `**/_services/**/*.{ts,tsx}`        | `warn` (agent)                                                         |
| `services-no-bare-error`            | `**/_services/**/*.{ts,tsx}`        | `warn` (agent, becomes always-on in step 4)                            |
| `no-client-import-of-services`      | `**/*.{ts,tsx}`                     | `warn` (agent)                                                         |
| `no-client-import-of-server-errors` | `**/*.{ts,tsx}`                     | `off` until step 3 creates `src/server/errors/`                        |
| `no-feature-nesting`                | `**/_features/**/*.{ts,tsx}`        | `warn` (agent)                                                         |
| `schema-must-be-pure-zod`           | `**/*.schema.ts`                    | `warn` (agent)                                                         |
| `require-schema-conventions`        | `**/*.schema.ts`                    | `warn` (agent)                                                         |
| `no-cross-domain-deep-import`       | `**/src/app/_domains/**/*.{ts,tsx}` | `error` (always on; the folder does not exist yet, so zero violations) |
| `no-default-export`                 | `**/src/app/_domains/**/*.{ts,tsx}` | `warn` (agent)                                                         |
| `require-use-client-suffix`         | `**/src/**/*.{ts,tsx}`              | `warn` (agent), with the Next special-file ignore patterns             |
| `require-server-action-suffix`      | `**/*.{ts,tsx}`                     | `error` (always on)                                                    |
| built-in `no-throw-literal`         | all                                 | `error` (always on)                                                    |
| `no-raw-tailwind-colors`            | all                                 | optional; only with a semantic-token design system                     |

"(agent)" means the severity applies only when `process.env.ESLINT_AGENT_RULES === "1"`, otherwise `off`. The gate keeps the plain lint stable while the tree is mid-migration.

**Transition globs.** Two entries in the table above are wider than the target and must be narrowed later. Mark each one with a comment in `next.js` naming the step that removes it, so the transition does not become permanent:

- `no-default-export` also runs on `**/src/app/_features/**/*.{ts,tsx}` while the root `_features/` folder still exists. Step 2 moves that folder under `_domains/` and the glob goes with it.
- `require-server-action-suffix` is exempted on `**/*.trpc.query.{ts,tsx}` and `**/*.trpc.mutation.{ts,tsx}`, because every pre-migration tRPC procedure file carries a module-level `"use server"`. Step 3 moves those into `_services/` and the exemption is dropped.

`require-use-client-suffix` runs on all of `src/**` rather than `_domains/**` only. That is a permanent widening, not a transition: the `.client.tsx` naming applies wherever a `"use client"` file lives, and a naming convention that holds in one folder only is half a convention. Record the widening in the target architecture document.

The wiring in `next.js` reads the gate once and applies it per glob block. There is one constant per ramp so later steps can flip a whole group:

```js
const enableAgentRules = process.env.ESLINT_AGENT_RULES === "1";
const servicesRulesSeverity = enableAgentRules ? "warn" : "off"; // step 3 flips to "error"
```

Scripts in `apps/web/package.json`:

```json
"lint": "eslint --max-warnings 0",
"lint:agent-rules": "ESLINT_AGENT_RULES=1 eslint .",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest"
```

`lint:agent-rules` deliberately omits `--max-warnings 0` **for the duration of the migration**. `--max-warnings 0` makes `warn` fail the command, which is the right final state but keeps the command red from the first day of the migration to the last, and a command that is always red is never read. During the migration the contract is: zero errors required, warnings reported and counted per rule as the progress metric. Restore `--max-warnings 0` at the end of step 4, once every convention rule is locked to `error`. `lint` keeps `--max-warnings 0` throughout. Count warnings per rule with `pnpm lint:agent-rules | grep -o 'local/[a-z-]*' | sort | uniq -c`, and record the count in the migration log. Root `package.json` forwards through Turbo: `"lint:agent-rules": "turbo run lint:agent-rules --filter=web"`, and `turbo.json` declares the `lint:agent-rules` and `test` tasks.

### Git hooks

`husky` + `lint-staged`: the pre-commit hook runs `pnpm typecheck`, `pnpm test`, and `npx lint-staged` (ESLint on staged files). Ratcheting rules (anything that only new or edited files must satisfy) work because the hook lints staged files only.

### Test harness

Vitest is installed in `apps/web` and in `packages/eslint-config` for the rule tests. `TZ` is pinned to `UTC` in the config so date tests are reproducible. Tests are colocated `*.test.ts`.

The harness matches the testing policy, which covers pure helpers and dependency-injected services, not components or hooks. In this repo that means `apps/web/vitest.config.ts` (a `.ts` config, not `.mts`), `environment: "node"`, the `@/*` alias resolved by Vite's native tsconfig path resolution, and no setup file. There is no jsdom and no `@testing-library/*`: they are added the day a component test exists, and not before, so the installed harness and the documented policy stay in agreement.

## What must be gone

Nothing yet. This step adds.

## Recommended strategy

Copy the files, wire the plugin, run `pnpm lint:agent-rules` and record the warning count per rule as the baseline. Fix nothing. The baseline becomes the burn-down chart for steps 2 to 4. Commit as one concern: "chore(tooling): adopt coding-standards skill and convention lint rules at warn".

## Definition of done

- `pnpm typecheck`, `pnpm lint`, `pnpm test` pass (no application code changed, so they should already).
- `pnpm --filter @repo/eslint-config test` passes (the rule tests).
- `pnpm lint:agent-rules` runs to completion and reports warnings without crashing on any rule. The total is written down in the migration log.
- `AGENTS.md` points to the skill and lists the required checks.
- The pre-commit hook runs the three checks.
