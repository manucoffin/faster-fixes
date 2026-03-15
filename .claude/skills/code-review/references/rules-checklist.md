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
- User-facing strings: French only, tutoiement (`tu`)

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
