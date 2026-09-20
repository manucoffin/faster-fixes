# Frontend: React components, client components, styling, query status

Everything for building UI in `apps/web`. For where files go, see [architecture.md](architecture.md). For surfacing errors, see [errors.md](errors.md).

## Component creation

Export pattern:

- Always use `export function` syntax.
- Never use default exports, anywhere under `src/`. The Next.js special files (`page`, `layout`, `error`, `not-found`, `sitemap`, `manifest`, …) are the one exception: the framework requires a default export from them.
- Use named exports consistently.

Props pattern:

- Pass a props object as the first parameter.
- Define a separate props type, destructure in the parameter list, type it inline.

```tsx
type MyComponentProps = {
  prop1: string;
  prop2: number;
};

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  return <div>{prop1}</div>;
}
```

## Client components

- Start the file with the `'use client'` directive.
- Name the file `*.client.tsx` (see [architecture.md](architecture.md)).
- Use `useState` and React hooks as normal.
- Handle browser APIs with hydration safety: guard browser-only code with `typeof window`, or use the `use-is-client` hook pattern.
- Prevent hydration mismatches with proper client checks.
- A client file must **not** import from a `_services/` path (except `*.schema.ts`); use a tRPC hook or a server component instead.

## TailwindCSS

Spacing and layout:

- Use `flex gap-n` over `space-y-n` / `space-x-n`.
- Combine with `flex-col` for vertical spacing.

Opacity:

- Use `bg-white/50` over `bg-white bg-opacity-50`.

Theme variables:

- Use semantic theme tokens over hardcoded colors.
- Prefer `text-muted-foreground` over `text-gray-500`.
- Follow design-system color tokens. The theme defines `muted-foreground`, `destructive`, `success`, `primary`, `secondary`, `border` and `foreground` in `packages/ui/src/styles/globals.css`. There is no `warning` and no `info` token; adding one is a two-step change, the CSS variable **and** a line in the lint rule's hue table, and until both land the yellow, amber and blue sites stay raw and unreported.
- **`no-raw-tailwind-colors` is driven by a hue-to-token table**, `DEFAULT_HUE_TOKENS` in `packages/eslint-config/local-rules/no-raw-tailwind-colors.js`: `red` maps to `destructive`, `green` and `emerald` to `success`, the neutral hues to `muted` / `border` / `foreground`. **A hue absent from the table is never reported**, so the rule can never demand a token that does not exist. A neutral hue's message names all three candidates, because the right one depends on what the class is for. The table is overridable through a `hueTokens` option that the shared config deliberately does not pass, so there is one source.
- **A `dark:` variant disappears when a class becomes a token; it is not ported.** A semantic token carries its own light and dark values, so `text-green-600 dark:text-green-400` collapses to `text-success`, never `text-success dark:text-success-400`. If the dark rendering is then wrong, that is a theme question (fix `--success` in `globals.css`), not a class question.
- **The four home-page illustration files are permanently exempt** through anchored `ignorePathPatterns` entries: `hero/hero-flow-animation.client.tsx`, `how-it-works/flow-animations.tsx`, `before-after-section.tsx` and `problem/problem-chat-animation.client.tsx`. They are drawn mock screens whose fixed colours are the point. Do not "fix" them and do not remove the exemptions.

## TanStack Query status handling

- Use the `matchQueryStatus` utility for query states; do not write imperative `isLoading`/`isError` branches.
- Handle all four states: `Loading`, `Errored`, `Empty`, `Success`.
- Keep components declarative: no multiple return statements for status, no repeated layout wrappers, no cluttered conditional rendering.

Each state has a required component, so the four branches look the same everywhere:

- **`Loading` must render `<Skeleton>`** from `@workspace/ui/components/skeleton`, shaped like the content it replaces. Never a spinner, plain text, or `null`.
- **`Errored` and `Empty` must render `<Empty>`** and its sub-components (`<EmptyHeader>`, `<EmptyMedia>`, `<EmptyTitle>`, `<EmptyDescription>`, `<EmptyContent>`) from `@workspace/ui/components/empty`. Never a raw string, a bare `<div>`, or `null`.
- `Errored` renders the message inside the `<Empty>` (see [errors.md](errors.md)), never a stack or a digest. **Read it through `getErrorMessage`** (`@/utils/error/get-error-message`): the `Errored` branch is handed an `unknown`, and the helper returns an `Error`'s non-blank message or falls back to `Something went wrong. Please try again.`, deliberately the same sentence the `errorFormatter` sends. Rendering the message at all is only safe because of that server-side masking.
- **Exception, folder consistency wins:** in the settings and admin card folders, the `Errored` branch renders `<Alert variant="destructive">` rather than `<Empty>`, because every neighbouring card already does. Eleven of the 39 `Errored` branches look like this. A card whose failures look like two different products is worse than a rule file describing the rest of the app. Match the folder you are in.

### What an `Errored` branch must never do

- **Never pass `query.data ?? []` into a child list, select or picker.** A failed read then renders "No teams available": an empty state standing in for an error. Nest `matchQueryStatus` around the picker instead.
- **Never fall back to a default that enables a destructive or duplicating action.** `isDefault ?? false` left `Delete organization` enabled and pointed at a default Organization; a `Not subscribed` fallback invited an admin to create a second Subscription. This is a safety rule, not a cosmetic one.
- **Exemption:** a value read only to enable a control may skip the `Errored` branch when failure yields the safe outcome, especially when the same query's failure is already on screen elsewhere on the page. The delete-confirmation name is the live case: empty on failure, so the input can never match and `Delete` stays disabled.
- **Exemption:** a table that owns its search field and its pagination keeps its own `isError` branch, because converting it to `matchQueryStatus` would remove the search field on a failure. Only its copy goes through `getErrorMessage`.
- **A provider that must always render its children publishes a query-state object instead of rendering an error.** `ActiveProjectProvider` exposes a four-field `ProjectsQueryState` shaped for `matchQueryStatus`, and its `isLoading` follows the query's `isPending`, not react-query's `isLoading`, so a read disabled until the active Organization is known counts as loading rather than empty.

```tsx
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";

export function PostsList() {
  const postsQuery = usePostsListQuery();

  return (
    <PostsListLayout>
      {matchQueryStatus(postsQuery, {
        Loading: (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ),
        Errored: (error) => (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Impossible de charger les articles</EmptyTitle>
              <EmptyDescription>{error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Empty: (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aucun article</EmptyTitle>
              <EmptyDescription>
                Tu n'as pas encore publié d'article.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Success: ({ data }) => (
          <ul>
            {data.map((post) => (
              <li key={post.id}>{post.title}</li>
            ))}
          </ul>
        ),
      })}
    </PostsListLayout>
  );
}
```

## Forms (create/edit)

- Build on the project `Form` component with `react-hook-form` + `zodResolver`. No hand-rolled form state.
- **Never drive form state with `useEffect`.** `react-hook-form` owns it: use `defaultValues`, `values`, `reset()`, or `useFormContext()`. An effect that syncs props into the form is a bug waiting to happen.
- When a form is used for both create and edit: split into a dialog wrapper (fetches data, `matchQueryStatus`) and a pure form component (receives loaded data as props).
- Form validation uses a Zod schema from `_services/` (see [schemas.md](schemas.md)); validation failures surface as per-field errors, not a toast (see [errors.md](errors.md)).
- The container hook (`use-*.ts`) owns form state + mutation + optimistic update + toast + invalidation.
- An action button that owns its own mutation lives in its own file and reads form state via `useFormContext()` (see [code-shape.md](code-shape.md)).

## User-facing copy

- English only. Professional, clear, and concise: match the tone of serious developer tools
  (Vercel, Linear, Stripe).
- No marketing fluff, no casual language, no exclamation marks. Prefer precise, understated
  wording.
- Never use the em dash character; use a comma, colon, or period.
