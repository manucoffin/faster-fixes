# Code Review Rules

Not covered by `pnpm lint:agent-rules` (linter handles: no default exports, use-client suffix, raw Tailwind colors, space-x/y, schema naming, tRPC output exports).

---

## 1. File Naming

In `_features/`, kebab-case, one concern per file:

- `[name].client.tsx` / `[name].server.tsx`
- `[operation].schema.ts`
- `[operation].trpc.query.ts` / `[operation].trpc.mutation.ts`
- `[operation].server.query.ts`
- `[action]-[noun].ts` (utilities)

## 2. React Components

- Props: `type ComponentNameProps = { ... }` (not `interface`), destructured in signature
- Query status: use `matchQueryStatus(query, { Loading, Errored, Empty, Success })` — never `if (query.isLoading)` chains

## 3. Zod Schemas

- Extend existing schemas instead of duplicating fields: `ExistingSchema.extend({ ... })`
- Use `z.nativeEnum(PrismaEnum)` when the enum exists in Prisma — never `z.enum(["A", "B"])` for DB-backed values

## 4. Forms

- Use the project `Form` component with `react-hook-form` + `zodResolver`
- No `useEffect` for form state — `react-hook-form` handles it

## 5. Language

- Identifiers, comments, filenames: English only
- User-facing UI copy: English only. Professional, clear, and concise — match the tone of serious developer tools (e.g., Vercel, Linear, Stripe). No marketing fluff, no casual language, no exclamation marks. Prefer precise, understated wording.

## 6. tRPC OutputType Reuse

Derive types from procedure outputs — don't write custom types that mirror existing procedure shapes:

```ts
import type { GetUserOutput } from "...get-user.trpc.query";
type UserCompany = GetUserOutput["company"]; // index into output instead of rewriting
```

## 7. Code Elegance

Flag and fix these patterns:

- Nested conditionals → prefer early returns / guard clauses
- Deeply nested ternaries → extract to variables or `if` blocks
- Boolean flag props/params → prefer separate components, functions, or named options
- Repeated expressions (3+ times) → extract to a variable or helper
- Unnecessary `else` after `return` or `throw`
- `as unknown as Type` casts or `// @ts-ignore` → fix the underlying type issue instead

## 8. Component Size & Folder Organization

Each file has a single responsibility. Split when a file mixes concerns, exceeds size thresholds, or groups unrelated flows into one folder.

### Size thresholds (flag, don't auto-fix — needs user judgment)
- Component file (`.client.tsx` / `.server.tsx`): **> 250 lines** is a smell
- Hook / util / schema / tRPC procedure file: **> 150 lines** is a smell
- Exception: mostly-declarative JSX with no logic branches may stay longer if cohesive

### Single-Responsibility red flags
A component is doing too much if it combines any 2+ of:
- Form state + business mutation wiring + layout + action buttons
- Multiple independent tRPC mutations (publish / unpublish / delete / update all inline)
- Presentational markup + data fetching for unrelated queries
- Modal/dialog logic + the page it lives on

Action buttons owning their own mutation (delete, publish, toggle, etc.) belong in their **own file**. Extract each one. Buttons can read shared form state via `useFormContext()` from `react-hook-form` — prefer that over prop drilling.

### Folder organization
In `_features/`, group by **flow**, not by type. One folder per flow (verb + noun):
- `update-article/` → `update-article.schema.ts`, `update-article.trpc.mutation.ts`, `use-update-article.ts`, `save-article-button.client.tsx`
- `delete-article/` → `delete-article.trpc.mutation.ts`, `delete-article-button.client.tsx`
- `get-article/` → `get-article.trpc.query.ts`
- `article-editor/` → the shell component + its sub-components (fields, tabs)

Flag: flat folders like `article-detail/` that mix unrelated flows (update + delete + publish + schema + form) into one directory. Propose a subfolder split.

### Form-state access pattern
When action buttons need form state (e.g., disable save when not dirty, disable publish when dirty) and live in a header slot **outside** the `<form>` element:
- Hoist the `<Form {...form}>` provider above the layout wrapper
- Reference the form via `<button form="form-id" type="submit">` (HTML attribute)
- Each button calls `useFormContext()` — no prop drilling of `form.formState`

### Example — splitting a god component

Before: `article-form.client.tsx` (678 lines) owns form + 4 mutations + tabs + layout + all action buttons.

After:
```
article-editor/
  article-editor.client.tsx          (shell: <Form>, <DashboardPageContent>, wires actions + form)
  article-editor-fields.client.tsx   (grid + title + content + tabs)
  article-metadata-tab.client.tsx    (metadata fields, reads via useFormContext)
  article-seo-tab.client.tsx         (SEO fields, reads via useFormContext)
update-article/
  update-article.schema.ts
  update-article.trpc.mutation.ts
  use-update-article.ts              (mutation hook + setError wiring)
  save-article-button.client.tsx     (submit btn, useFormContext for isDirty)
delete-article/
  delete-article.trpc.mutation.ts
  delete-article-button.client.tsx   (self-contained: AlertDialog + mutation)
publish-article/ unpublish-article/ view-article/ …
```

### When to flag vs auto-fix
- Flag only: large refactors (splitting god components, restructuring folders) — confirm direction with the user before moving files
- Auto-fix: trivial extractions (pulling a 20-line sub-component out of a 300-line file, moving a loose mutation file into an obvious flow folder) where the split is unambiguous
