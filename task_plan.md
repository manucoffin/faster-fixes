# Task Plan — Milestone 1: Data Model & Project Setup

## Goal
Implement Prisma models (Project, WidgetConfig, Reviewer, Feedback), project CRUD dashboard, reviewer/share link management, API key management, and public POST/GET /api/feedback endpoints.

## Phases

### Phase 1 — Prisma Models [complete]
- [x] Create `packages/database/schema/project.prisma` with Project, WidgetConfig, Reviewer, Feedback models
- [x] Add `projects Project[]` relation to Organization in `organization.prisma`
- [x] Add `Feedback feedback[]` relation to Asset in `asset.prisma`

### Phase 2 — Project tRPC Procedures [complete]
- [x] `getProjects` query (list org projects)
- [x] `createProject` mutation (generate API key, create WidgetConfig, enforce plan limit)
- [x] `getProject` query (single project)
- [x] `updateProject` mutation (name, URL, widget config)
- [x] `regenerateApiKey` mutation
- [x] `deleteProject` mutation

### Phase 3 — Reviewer tRPC Procedures [complete]
- [x] `getReviewers` query
- [x] `createReviewer` mutation (generate token)
- [x] `revokeReviewer` mutation (toggle isActive)

### Phase 4 — Public API Routes [complete]
- [x] `POST /api/feedback` — validate API key, reviewer token, rate limit, save feedback
- [x] `GET /api/feedback` — validate API key, reviewer token, return pins

### Phase 5 — Dashboard UI [complete]
- [x] Add "Projects" sidebar nav item
- [x] `/projets` — project list page
- [x] `/projets/nouveau` — create project page (with API key reveal)
- [x] `/projets/[projectId]` — project detail page (tabs: Overview, Settings, Reviewers)
- [x] Project settings tab: edit name/URL, widget config, API key management, delete
- [x] Reviewers tab: list reviewers, add reviewer, revoke reviewer

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

## Key Decisions
- API routes are Next.js route handlers (not tRPC), at `app/api/feedback/route.ts`
- Rate limiting uses existing `RateLimit` Prisma model (key = reviewer token)
- Plan limit: check `subscription.plan === 'basic'` → max 1 project
- Feedback models are in English; UI strings may be in French per existing patterns
- The `(authenticated)` route group uses `/projets` path (French naming convention used in codebase)
