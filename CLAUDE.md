# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js monorepo using Turbo with the following structure:
- **apps/web**: Next.js 16 application (main startup platform)
- **packages/database**: Prisma ORM setup with PostgreSQL
- **packages/ui**: Shared Radix UI component library
- **packages/typescript-config**: Shared TypeScript configuration
- **packages/eslint-config**: Shared ESLint configuration

Key technologies: Next.js 16, React 19, Prisma 7, Better Auth, Stripe, TailwindCSS 4, Turbo 2.

## Essential Commands

### Development
- `pnpm dev` - Start development server (all packages with Turbopack)
- `pnpm lint` - Run linting across all packages
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm type:check` - Check TypeScript types

### Building & Deployment
- `pnpm build` - Build all packages (requires DATABASE_URL in env)
- `pnpm start` - Start production server (web app only)

### Database Management
- `pnpm db:gen` (in packages/database) - Generate Prisma client
- `pnpm migrate:dev` (in packages/database) - Create and apply migrations
- `pnpm migrate:reset` (in packages/database) - Reset database (local only)
- `pnpm db:pull` (in packages/database) - Pull schema from database

### Development Notes
- Run commands from root directory unless specifically in a package
- Database commands require `.env.local` with `DATABASE_URL`
- Always run `pnpm type:check` before committing TypeScript changes
- Pre-commit hooks run `pnpm type:check` and `pnpm lint` on modified files

## Architecture

### Monorepo Structure with Turbo
- **Turbo** handles build orchestration, caching, and task parallelization
- Task dependencies defined in `turbo.json` (e.g., build depends on ^build from dependencies)
- Commands run via Turbo automatically handle workspace dependencies
- UI package must be transpiled in Next.js config due to CSS imports

### Web App Structure (apps/web/src/)

Following the pattern defined in `.claude/rules/00-architecture/page-folder-structure.mdc`:

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── [dynamic]/         # Dynamic routes
├── server/
│   ├── auth/              # Better Auth configuration
│   │   ├── config/        # Auth configuration modules
│   │   ├── plugins/       # Custom auth plugins
│   │   │   ├── custom-session.ts
│   │   │   ├── organization.ts
│   │   │   └── stripe.ts
│   │   └── index.ts       # Main auth export
│   └── stripe/            # Stripe server integration
├── components/
│   ├── providers.tsx      # Client-side providers (theme, auth)
│   └── [other-shared]/
├── hooks/                 # Client-side React hooks
├── lib/                   # Utilities and helpers
└── app/[feature]/         # Feature pages follow the pattern:
    ├── page.tsx
    ├── _components/       # Page-specific components
    ├── _trpc/            # tRPC routers (if using)
    ├── _server/          # Server-only code
    ├── _schemas/         # Validation schemas
    └── _constants/       # Page constants
```

### Page Implementation Pattern

For new pages in `src/app/`, follow this structure:
- Place page-specific components in `_components/` subdirectory
- Use `_server/` for non-tRPC server functions
- Use `_schemas/` for Zod validation schemas
- Use `_constants/` for page-specific constants
- Keep all page-related code co-located within the page folder

Shared functionality goes in `src/app/_features/` using feature-based organization.

### Database Layer (packages/database)

- **Schema**: `prisma/schema.prisma` - PostgreSQL data model
- **Generated Client**: `generated/prisma/` - Auto-generated Prisma Client (never edit directly)
- **Migrations**: `prisma/migrations/` - SQL migration files
- **Adapter**: Uses `@prisma/adapter-pg` for PostgreSQL connections

Key models (defined in schema.prisma):
- User, Session, Account (Better Auth)
- Profile, MarketingPreferences (custom models from recent commits)
- Organization-related models (from organization plugin)

### Authentication (Better Auth)

Better Auth is configured in `src/server/auth/index.ts` with:
- PostgreSQL Prisma adapter
- Session caching (5-minute cookie cache for performance)
- Stripe plugin for payment integration
- Custom session plugin for enriched session data
- Organization plugin for multi-tenant features
- Admin and lastLoginMethod plugins

All auth models are automatically managed by Better Auth through the Prisma adapter.

## Code Standards & Patterns

### TypeScript
- Extend `@workspace/typescript-config/base.json` in all tsconfig.json files
- Use strict mode and full type inference
- Reference `.claude/rules/02-programming-languages/typescript-guidelines.mdc`

### React Components
- Use 'use client' for interactive components (browser APIs, hooks)
- Reference `.claude/rules/03-frameworks-and-libraries/react-component-creation.mdc` for export patterns
- Reference `.claude/rules/03-frameworks-and-libraries/react-client-components.mdc` for client-side patterns

### Styling
- Use TailwindCSS v4 (full syntax available)
- Reference `.claude/rules/03-frameworks-and-libraries/tailwind-css-conventions.mdc` for conventions
- Global styles in `packages/ui/globals.css`
- Theme variables available via CSS variables from Tailwind config

### API Integration
- Use Stripe SDK for payment processing (already configured in web app)
- Better Auth handles user authentication (session management via cookies)
- Reference `.claude/rules/03-frameworks-and-libraries/tanstack-query-status-matching.mdc` if adding TanStack Query

### Database Validation & Schemas
- Use Zod for runtime validation
- Reference `.claude/rules/03-frameworks-and-libraries/zod-schema-conventions.mdc` for schema patterns
- Reference `.claude/rules/01-standards/crud-naming-conventions.mdc` for CRUD function naming

## Important Notes

### Environment Configuration
- `.env.example` in apps/web documents required environment variables
- `BETTER_AUTH_SECRET` required for auth system
- Database requires `DATABASE_URL` (PostgreSQL connection string)
- Never commit actual `.env` or `.env.local` files

### Monorepo Conventions
- All imports from workspace packages use `@workspace/` prefix (e.g., `@workspace/ui/components/button`)
- Database package exports as `@workspace/db`
- UI package exports as `@workspace/ui`
- Internal path aliases in web app use `@/` (e.g., `@/src/components/providers`)

### CSS & Theme System
- UI package provides globals.css with base TailwindCSS setup
- Components use shadcn/ui patterns (Radix UI + Tailwind)
- Next.js fonts (Geist sans and mono) pre-configured in root layout

### Pre-commit Hooks
The `.claude/settings.json` defines automated hooks:
- TypeScript files trigger `pnpm type:check`
- All writes/edits trigger `pnpm lint`
- These run automatically after tool use - monitor output for lint/type errors

### Build Pipeline
- `turbo.json` defines task dependencies and caching
- Build task requires `DATABASE_URL` environment variable
- Turbopack used in development for faster iteration
- ESM modules (`"type": "module"` in package.json)

## Project Rules

Custom rules are defined in `.claude/rules/` and indexed in `rules-index.md`. Key rules to follow:
- Page folder structure and organization
- CRUD naming conventions
- TypeScript guidelines
- React component patterns
- TailwindCSS conventions
- Zod schema conventions
