# CMS Architecture Decision

## Context

The project originally used Payload CMS (v3) in a separate `apps/cms` app for blog content management. This document records the decision to replace it with a custom CMS built on TipTap and Puck.

## Decision: Replace Payload with TipTap + Puck

### Why Payload was removed

- **Two separate databases** — Payload ran its own PostgreSQL instance with its own migration system, disconnected from the main Prisma schema. Two sources of truth, two migration systems, two sets of env vars.
- **Two separate apps** — `apps/cms` on port 3001 + `apps/web`. Extra deploy surface for limited gain.
- **Converter maintenance burden** — Every Lexical feature required a parallel custom converter on the web side (7+ converters already). These needed to stay in sync manually.
- **Version lock-in** — Payload 3.x moves fast. Plugin compatibility (e.g. a potential Puck plugin) is a recurring risk.
- **Overkill for the actual use case** — Payload is a full headless CMS framework. We only needed blog posts, a few static pages, and media uploads.
- **Bad for a boilerplate** — People forking the project would need to understand Payload's plugin system, Lexical converters, and a separate app on top of everything else.

### What replaces it

| Need | Solution |
|------|----------|
| Blog post rich text | TipTap |
| Visual page builder | Puck |
| Media uploads | Uploadthing (handles S3, resizing, presigned URLs) |
| Admin interface | `/admin/content/` routes inside `apps/web` |
| Data | Prisma models (`Post`, `Page`, `Media`, `Category`, etc.) in the shared database |

### Key benefit

Everything lives in the same Prisma schema as auth, subscriptions, and users. Blog posts can be queried alongside user data in a single Prisma query. One database, one migration system, one deployment.

---

## Decision: Keep CMS inside `apps/web`, not a separate app

### Why not split CMS and admin into separate apps

The intuition that "separate apps = cleaner" or "separate apps = more secure" is misleading here.

**Security**: The only real security boundary is the database. If both apps share the same PostgreSQL connection string, a compromised CMS app can query user tables directly — app-layer separation provides nothing. True isolation requires scoped DB credentials and network-level rules, which is independent of how many Next.js apps you run.

**Auth coordination**: Better Auth sessions are cookie-based. Two apps on different domains means two separate auth sessions, duplicated middleware, or a shared auth subdomain — non-trivial to maintain correctly.

**Operational overhead**: Two Vercel projects, two sets of env vars, two deployment configs. Every environment variable change needs to happen twice.

### Where the CMS lives

Inside `apps/web` under the existing `/admin/` route group, gated by the existing role check in `admin/layout.tsx`:

```
admin/
├── utilisateurs/          # existing user management
├── content/
│   ├── posts/             # TipTap editor
│   │   ├── page.tsx       # list
│   │   └── [id]/page.tsx  # edit
│   └── pages/             # Puck editor
│       ├── page.tsx
│       └── [id]/page.tsx  # edit
```

Single auth session, single deploy, zero coordination overhead.

### When splitting would make sense

If the boilerplate's end-users (people who fork it) need their *own customers* to edit content, then the CMS becomes a customer-facing workspace rather than an internal admin tool. In that case, separation is an architectural decision driven by product requirements, not code cleanliness.
