# Findings — Milestone 1

## Codebase Structure
- Monorepo with `apps/web` (Next.js) and `packages/database` (Prisma)
- Prisma schema is split: `packages/database/schema/*.prisma` — each domain gets its own file
- Generated Prisma client: `packages/database/generated/prisma` (ESM, `.ts` extension)

## Patterns
- tRPC procedures: `"use server"` at top, `protectedProcedure` for auth, named export + inferProcedureOutput type
- File naming: `.trpc.mutation.ts` / `.trpc.query.ts` / `.schema.ts`
- Router assembly: `_utils/trpc-router.ts` per feature section
- UI: `DashboardPageContent` + `DashboardSection` components
- French URL slugs: `/organisation`, `/mon-compte`, `/facturation` — so projects → `/projets`

## Organization.prisma
- Needs `projects Project[]` relation added

## Asset.prisma
- Needs `feedback Feedback[]` relation added (screenshotId FK)

## Rate Limiting
- `RateLimit` model exists: `key String @unique`, `count Int`, `lastRequest BigInt`
- Key format for reviewer: `feedback:reviewer:{reviewerToken}`

## Subscription Plan Check
- `subscription.plan` field. Need to determine what values are used (likely 'basic', 'premium')
- To check limit: `prisma.subscription.findFirst({ where: { referenceId: orgId } })` then check plan

## API Key Generation
- Use `crypto.randomBytes(32)` → hex string, prefix `ff_`
- Store SHA-256 hash and last 4 chars
- SHA-256: `crypto.createHash('sha256').update(rawKey).digest('hex')`
