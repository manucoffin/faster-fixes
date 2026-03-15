---
name: code-review
description: Review and auto-fix code against project rules and conventions. Use after completing a feature, big refactor, or before committing. Invoke with /code-review. Checks modified/created files for file naming, React patterns, tRPC types, Zod schemas, forms, TailwindCSS colors, and code elegance, then directly fixes violations in place.
---

# Code Review

Review changed files against project conventions and fix violations directly.

## Workflow

### Step 1: Identify changed files

Run `git diff --name-only --diff-filter=ACMR HEAD` to get modified/created files. If no changes against HEAD, try `git diff --name-only --diff-filter=ACMR main...HEAD`.

Filter to `.ts` and `.tsx` files inside `apps/` or `packages/`. Skip `node_modules/`, `.next/`, `dist/`.

### Step 2: Load rules

Read `references/rules-checklist.md` in this skill's directory. This contains all rules with examples.

### Step 3: Review each file

Read each changed file and check against applicable rules:

| File pattern | Rules to apply |
|---|---|
| Any `.ts` / `.tsx` | #1 File naming, #5 Language, #7 Code elegance |
| `*.client.tsx` | + #2 React components, #2 Query status matching |
| `*.schema.ts` | + #3 Zod schemas (extend, nativeEnum for Prisma enums) |
| `*.trpc.mutation.ts` / `*.trpc.query.ts` | + #6 tRPC OutputType reuse |
| Any `.ts` / `.tsx` with hand-written types | + #6 tRPC OutputType reuse |
| Any `.tsx` with `className` | + TailwindCSS semantic colors (enforced by linter) |
| Any `.tsx` with form logic | + #4 Forms (react-hook-form, no useEffect) |

### Step 4: Fix violations

For each violation:
1. Fix the code directly using Edit tool
2. Track what was fixed

Only flag (without fixing) violations that need user judgment — e.g., whether to extend an existing schema or architectural choices.

### Step 5: Summary

```
## Code Review Complete

### Fixed (N)
- `path/file.tsx`: [rule #] what changed

### Needs attention (N)
- `path/file.tsx`: [rule #] what needs user decision

### Clean (N files)
- Files that passed all checks
```

## Scope Limits

- Only review changed files, not the entire codebase
- Fix convention violations only — do not change logic or behavior
- Do not add features, comments, or docstrings
- Do not refactor beyond rule compliance
