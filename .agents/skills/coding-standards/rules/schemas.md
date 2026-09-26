# Zod schema conventions

Shared by the backend (tRPC `.input()`) and the frontend (form resolver), so this is its own rule.

## Placement (apps/web)

- A `*.schema.ts` lives in its scope's `_services/` folder (consumed by both the tRPC `.input()` and the client form resolver). See [backend.md](backend.md) and [architecture.md](architecture.md).
- A schema must stay **pure-Zod**. `local/schema-must-be-pure-zod` is an allowlist: a schema may import `zod`, another `*.schema` file, `@workspace/db/generated/prisma/enums`, and the modules named in `schemaPurityOptions` in `packages/eslint-config/next.js`. Anything else is reported, whether or not anybody had met it before, because a schema is imported by client forms and drags whatever it reaches into the bundle. A type-only import is free.
- **A new exception is a named entry, not a disable comment.** Add the specifier to `schemaPurityOptions.allowImportPatterns` with a comment saying why the module is pure, and a reviewer reads it in the diff.
- **A Zod enum that is domain vocabulary is not a `*.schema.ts`.** When the enum is the runtime validator for a glossary value that many modules read (rather than the input of one operation), it lives in `_types/` and keeps the glossary name: `_domains/feedback/_types/feedback-status.ts` exports `FeedbackStatusEnum` and `FeedbackStatus`. Filing it as a schema would force the `Input` suffix of the section below onto a glossary type. See [architecture.md](architecture.md).

## File structure

**Prose only**, no rule. "Tightly coupled" is the whole of the judgement here and a linter cannot read it: a rule counting exported schemas would reject the multi-step form the section below asks for.

- **One exported schema per file by default.** The file is named after that schema's operation (`update-client.schema.ts`).
- **Multiple schemas in one file only when they are tightly coupled** — a base schema plus the schema(s) composed from it, or pieces that assemble into one final schema defined in the **same** file (e.g. multi-step forms: `Step1Schema` + `Step2Schema` -> `SignupSchema`).
- Do **not** split tightly-coupled schemas across files just to honor one-per-file. Do **not** bundle unrelated schemas into one file for convenience (no junk-drawer schema files).

## Composition

- **Cross-file composition is the norm and is encouraged.** The classic case is the create -> update pair: the update schema imports the create schema and extends it.

  ```ts
  // update-invoice.schema.ts
  export const UpdateInvoiceSchema = CreateInvoiceSchema.extend({
    id: z.string(),
  });
  ```

- Use `.extend()`, `.partial()`, `.omit()` to derive schemas. A derived schema lives in its own file (one schema per file) unless it is tightly coupled to its base (see above).
- **`.merge()` is deprecated in zod 4**, and reported by `local/require-schema-conventions`. Spread the other schema's shape instead: `Base.extend(Other.partial().shape)`, or `z.object({ ...Base.shape, ...Other.shape })` for the best `tsc` performance.

## Schema naming

Enforced by `local/require-schema-conventions` on `**/*.schema.ts`: a `*.schema.ts` exports at least one schema, its name is PascalCase and ends in `Schema`. The verb the prefix mirrors is **prose only**, because the schema and its service sit in different files.

- **PascalCase**, suffixed with `Schema`: `CreateInvoiceSchema`.
- **The prefix mirrors the service operation the schema validates** — the schema, the function, and the file all carry the same verb:
  - `create-invoice.ts` -> `createInvoice` -> `CreateInvoiceSchema`
  - `revoke-agent-token.ts` -> `revokeAgentToken` -> `RevokeAgentTokenSchema`
- The verb set follows [naming.md](naming.md): generic CRUD verbs by default, a precise domain verb (`Restore`, `Revoke`, `Upgrade`, ...) when the operation is a distinct domain transition. Banned synonyms of `update` (`edit`/`modify`/`save`/`change`) are banned here too: it is `UpdateClientSchema`, not `EditClientSchema`.

## Type extraction

Enforced by `local/require-schema-conventions`: an `Input` type is `z.infer` of a schema declared in the same file, a `Values` type is `z.input` of one, and a plural `Inputs` suffix is reported. A schema fragment that exports no `Input` type is fine, and a type that validates something other than an input keeps its real name, as the caveat below says.

- Infer the type with `z.infer<typeof SchemaName>`.
- **Name the type by replacing the `Schema` suffix with `Input`** — drop `Schema`, do not keep it:
  - `CreateInvoiceSchema` -> `CreateInvoiceInput` (not `CreateInvoiceSchemaType`, not `CreateInvoiceSchemaInput`).
- **Always singular `Input`** (one input object), never plural `Inputs`.
- Rationale: these schemas exist to be the **input** to a tRPC mutation (`.input()`) and a form resolver, so the inferred type _is_ the input DTO. `Input` carries that meaning; a bare `Type` suffix is semantically empty.
- Caveat: `Input` is correct because `*.schema.ts` here are mutation/form inputs by construction. If a schema ever validates something that is **not** input (an external API response, a parsed config), name the type for what it actually is.

### The `Values` companion type (forms)

`z.infer` is the **output** type. When a schema carries a `.default()` or a coercion, its **input** type differs: the defaulted key is optional on the way in and guaranteed on the way out. `zodResolver` (`@hookform/resolvers` v5) reflects that: it returns `Resolver<z.input<S>, Context, z.output<S>>`, so `useForm<XInput>` no longer typechecks against it.

For those schemas, export a second type alongside `XInput`, named by replacing the `Schema` suffix with `Values`:

```ts
export const CreateToolSchema = z.object({
  title: z.string().min(1, "Title is required"),
  order: z.number().int().min(0).optional().default(0),
});

export type CreateToolInput = z.infer<typeof CreateToolSchema>;

// Pre-parse shape of the form: `order` is optional on the way in.
export type CreateToolValues = z.input<typeof CreateToolSchema>;
```

and wire the form with both:

```ts
const form = useForm<CreateToolValues, unknown, CreateToolInput>({
  resolver: zodResolver(CreateToolSchema),
  defaultValues: { title: "", order: 0 },
});
```

Only add `XValues` when input and output actually diverge. A schema with no `.default()` and no coercion keeps `XInput` alone, and `useForm<XInput>` stays correct.

## Prisma integration

- Use **`z.enum(PrismaEnum)`** for a Prisma enum. `apps/web` is on zod 4, where `z.enum()` is overloaded to absorb an enum-like object, and **`z.nativeEnum()` is deprecated** and reported by `local/require-schema-conventions`.
- Never hand-write `z.enum(["A", "B"])` to mirror a DB-backed enum: it silently drifts from the schema. **Prose only**, no rule: a literal list is indistinguishable from a legitimate local const array. Import the enum from `@workspace/db/generated/prisma/enums` and pass it to `z.enum()`.
- `z.enum()` is also how you declare a local const array of string literals (`z.enum(ALLOWED_FILE_TYPES)`) that is not a Prisma enum. Same function, both cases.
- **`@workspace/db/generated/prisma/enums` is the only database specifier a schema may import**, enforced by `local/schema-must-be-pure-zod` and, for the rest of the app source, by the database entry point row of `local/no-cross-layer-import`. It is the one database entry point on the `schema-must-be-pure-zod` allowlist: the enums module is types and string unions, while `@workspace/db`, `@workspace/db/index` and `@workspace/db/generated/prisma/client` pull the client into a module a client form imports.

## Example

```ts
export const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  // other properties...
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```
