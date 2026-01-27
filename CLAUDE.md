# CLAUDE.md

Guidance for Claude Code working with this repository.

## Project Overview

Next.js 16 monorepo using Turbo with:

- **apps/web**: Next.js 16 application
- **packages/database**: Prisma ORM with PostgreSQL
- **packages/ui**: Shared Radix UI component library
- **packages/typescript-config** & **packages/eslint-config**: Shared configs

Key technologies: React 19, Prisma 7, Better Auth, Stripe, TailwindCSS 4, Turbo 2.

## Essential Commands

**Development**: `pnpm dev`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm type:check`

**Building**: `pnpm build`, `pnpm start`

**Database**: `pnpm db:gen`, `pnpm migrate:dev`, `pnpm migrate:reset`, `pnpm db:pull`

**Notes**:

- Run from root directory unless in a specific package
- Database commands need `.env.local` with `DATABASE_URL`
- Always run `pnpm type:check` before committing
- Pre-commit hooks run type checks and linting automatically

## Architecture

### Route Groups & Layout Structure

The app uses route groups with distinct layouts and access levels:

```
src/app/
├── layout.tsx                # Root (providers, fonts)
├── (auth)/                   # Public auth routes
│   ├── connexion/
│   ├── inscription/
│   └── mot-de-passe-oublie/
├── (public)/                 # Public content
│   ├── page.tsx
│   └── blog/[slug]/
├── (authenticated)/          # Protected user routes (auth guard in layout)
│   ├── mon-compte/
│   ├── mon-compte/facturation/
│   ├── mon-compte/parametres/
│   └── _features/
├── admin/                    # Admin routes (role check in layout)
│   └── utilisateurs/
└── api/                      # API routes
```

**Key principle**: Route groups apply their `layout.tsx` to child routes. Auth checks happen at layout level.

### Features Organization

**Global Shared Features** (`src/app/_features/`)

```
core/              # Dashboard/UI wrappers (dashboard-page-content, breadcrumbs, etc)
auth/              # Auth utilities
subscription/      # Stripe integration
seo/               # SEO schemas
payload/           # CMS utilities
organization/      # Organization logic
```

**Page-Specific Features** (Within route folders)

Each page can have `_features/` for local components:

```
mon-compte/facturation/
├── _features/
│   ├── current-plan/
│   │   ├── current-plan-card.client.tsx
│   │   ├── update-plan.schema.ts
│   │   └── get-active-subscription.trpc.query.ts
│   └── subscription-status/
│       ├── subscription-status-banner.client.tsx
│       └── ...
└── page.tsx
```

### File Organization & Naming

Each feature/component groups related files:

```
_features/[feature-name]/
├── [feature-name].client.tsx           # Main component ("use client")
├── [feature-name].schema.ts            # Zod validation
├── [feature-name].trpc.mutation.ts     # Server mutations
├── [feature-name].trpc.query.ts        # Server queries
├── [helper-name].ts                    # Utilities
└── [sub-feature]/                      # Nested features
```

**Naming patterns**:

- Client components: `[name].client.tsx`
- Server components: `[name].server.tsx`
- Schemas: `[operation].schema.ts` (e.g., `update-profile.schema.ts`)
- tRPC mutations: `[operation].trpc.mutation.ts`
- tRPC queries: `[operation].trpc.query.ts`
- Server functions: `[operation].server.query.ts`
- Utilities: `[action]-[noun].ts` (e.g., `generate-slug.ts`)

### Component Patterns

**Client Component with tRPC**

```typescript
"use client";
import { trpc } from "@/lib/trpc/trpc-client";

export function ProfileForm() {
  const query = trpc.authenticated.account.getProfile.useQuery();
  const mutation = trpc.authenticated.account.updateProfile.useMutation();
  return <form>{/* ... */}</form>;
}
```

**tRPC Query Status Matching** (clean Loading/Error/Success handling)

```typescript
return matchQueryStatus(query, {
  Loading: <Skeleton />,
  Errored: <Error />,
  Empty: <Empty />,
  Success: ({ data }) => <Display data={data} />,
});
```

**Server Component with Suspense**

```typescript
export default async function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Authentication & Protected Routes

**Layout-level checks** (e.g., `(authenticated)/layout.tsx`):

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/connexion");
if (adminRoute && !session.user.isAdmin) redirect("/unauthorized");
```

Better Auth handles sessions via cookies with:

- PostgreSQL Prisma adapter
- 5-minute session caching
- Stripe, organization, and custom session plugins

### Key Architectural Principles

1. **Co-locate features**: Components, schemas, and logic together in `_features/`
2. **Underscore prefixes** (`_features/`, `_components/`, `_server/`) don't create routes
3. **Route groups** organize sections with different layouts and auth levels
4. **Explicit execution context**: Clear naming shows if code runs client/server
5. **Server/Client split**: tRPC for data flow, Suspense for async loading
6. **Feature isolation**: Each feature has all related files in one place

## Code Standards

### Required Tools/Patterns

- **TypeScript**: Strict mode, full type inference (see `.claude/rules/02-programming-languages/typescript-guidelines.mdc`)
- **React**: Use `'use client'` for interactive components (see `.claude/rules/03-frameworks-and-libraries/react-component-creation.mdc`)
- **Styling**: TailwindCSS v4 with shadcn/ui patterns (see `.claude/rules/03-frameworks-and-libraries/tailwind-css-conventions.mdc`)
- **Validation**: Zod schemas (see `.claude/rules/03-frameworks-and-libraries/zod-schema-conventions.mdc`)
- **API**: tRPC for queries/mutations, Stripe SDK for payments
- **Database**: Prisma ORM with PostgreSQL (see schema at `packages/database/prisma/schema.prisma`)

### Import Conventions

- Workspace packages: `@workspace/ui`, `@workspace/db`
- Internal aliases in web app: `@/` (e.g., `@/lib/trpc/client`)

## Important Notes

- `.env.example` documents required environment variables
- Never commit `.env` or `.env.local` files
- UI package global styles in `packages/ui/globals.css`
- Pre-commit hooks auto-run type checks and linting on file changes

## Project Rules

Custom rules in `.claude/rules/` define standards for:

- Page folder structure and organization
- CRUD naming conventions
- TypeScript guidelines
- React component patterns
- TailwindCSS conventions
- Zod schema conventions

See `.claude/rules/rules-index.md` for the full index.
