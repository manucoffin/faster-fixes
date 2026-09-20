# Code shape: file size, single responsibility, readability

How big a file may get and when to split it. Applies to any file you write or review in `apps/web`. Where the split _goes_ is governed by [architecture.md](architecture.md) (buckets) and [backend.md](backend.md) (the `_services/` layer); this file only says **when** a file has grown past one responsibility, and what shape the code inside it should take.

## Readability

Flag and fix these, they are almost always mechanical. Three of the six are enforced; the rest
are review judgements.

- Nested conditionals → early returns / guard clauses. **Prose only**, no rule.
- Deeply nested ternaries → extract to a named variable or an `if` block. Enforced by
  `no-nested-ternary`.
- Boolean flag props/params → separate components, separate functions, or a named options object. **Prose only**, no rule.
- The same expression repeated 3+ times → extract to a variable or a helper. **Prose only**, no rule.
- `else` after a `return` or a `throw` → drop it. Enforced by `no-else-return`.
- `as unknown as Type` casts → fix the underlying type instead. Enforced by
  `local/no-restricted-patterns`, which spares `*.test.ts(x)`: a service test builds a partial fake
  of the Prisma client and passes it through the dependency-injection seam. `// @ts-ignore` and
  `// @ts-expect-error` without a reason are **prose only**.

## Size thresholds

**Prose only**, no rule, and deliberately so. Thresholds are a smell signal, not a hard limit:
**flag, do not auto-split**, because where the seam goes needs judgement. A zero-warning lint has
no way to say "look at this" without also saying "this cannot land".

- Component file (`*.client.tsx` / `*.server.tsx`): **> 250 lines**.
- Hook, helper, schema, or service file: **> 150 lines**.
- Exception: mostly-declarative JSX with no logic branches may stay longer if it is genuinely one cohesive block.

## Single-responsibility red flags

**Prose only**, no rule.

A component is doing too much if it combines any 2+ of:

- Form state + mutation wiring + layout + action buttons.
- Several independent mutations inlined side by side (publish / unpublish / delete / update).
- Presentational markup + data fetching for unrelated queries.
- Dialog/modal logic + the page it lives on.

**An action button that owns its own mutation (delete, publish, archive, toggle) belongs in its own file** inside the feature slice. Extract one file per action. A button that needs form state reads it with `useFormContext()` from `react-hook-form` rather than having `form.formState` drilled into it.

## Splitting a god component

The UI split happens inside the scope's `_features/`; the data ops it calls live in the scope's `_services/` and do **not** move into the feature folder (see [architecture.md](architecture.md)).

Before: `professional-form.client.tsx`, 678 lines, owning the form + 4 mutations + tabs + layout + every action button.

After:

```
_services/                                 # data layer, unchanged location
  get-professional.ts
  update-professional.ts
  update-professional.schema.ts
  delete-professional.ts

trpc-router.ts                             # thin transport at the scope root

_features/professional-editor/
  professional-editor.client.tsx           # shell: <Form>, layout, wires actions
  professional-editor-fields.client.tsx    # grid + fields + tabs
  professional-metadata-tab.client.tsx     # reads via useFormContext
  use-update-professional.ts               # container hook: state + mutation + toast
  save-professional-button.client.tsx      # submit button, useFormContext for isDirty
  delete-professional-button.client.tsx    # self-contained: AlertDialog + mutation
```

One feature folder per capability, never a feature nested in a feature (`no-feature-nesting`). A grown child promotes to a sibling.

## Form-state access across a layout boundary

When action buttons need form state but sit in a header slot **outside** the `<form>` element:

- Hoist the `<Form {...form}>` provider above the layout wrapper.
- Wire the button to the form with the HTML attribute: `<button form="form-id" type="submit">`.
- Each button calls `useFormContext()`. No prop drilling of `form.formState`.

## Flag vs auto-fix

- **Auto-fix**: the readability items above, and trivial extractions where the seam is unambiguous (pulling a self-contained 20-line sub-component out of a 300-line file).
- **Flag only, confirm with the user first**: splitting a god component, moving files between buckets, restructuring a folder. Propose the target layout, do not move files unasked.
