# Documentation

> Project documentation organized by purpose. Each doc follows an AI-friendly format with one-liner summaries, core file tables, and scannable sections.

## Structure

```
documentation/
├── systems/     # How internal systems work
├── features/    # Domain and business feature docs
├── guides/      # Operational how-tos
└── decisions/   # Architecture Decision Records (ADRs)
```

## File Index

### `systems/` — Internal infrastructure

| Doc | Summary |
|-----|---------|
| [cache-tags.md](systems/cache-tags.md) | Type-safe, tRPC-inspired cache invalidation for `unstable_cache` |
| [notifications.md](systems/notifications.md) | Multi-channel notification delivery with typed payloads and Inngest |

### `features/` — Business features

| Doc | Summary |
|-----|---------|
| [appointments.md](features/appointments.md) | Manual-confirmation booking system for pet parent ↔ professional appointments |
| [stripe.md](features/stripe.md) | Stripe-powered subscription management with Better Auth plugin |

### `guides/` — Operational how-tos

| Doc | Summary |
|-----|---------|
| [inngest.md](guides/inngest.md) | Local development and testing of Inngest async functions |
| [blog-redirects.md](guides/blog-redirects.md) | WordPress → Next.js blog URL migration with 301 redirects |
| [payload-cms-migrations.md](guides/payload-cms-migrations.md) | Skip migrations in dev, create one per finalized schema change |
| [upgrade-packages-versions.md](guides/upgrade-packages-versions.md) | Upgrading Next.js and Payload CMS with version sync rules |
| [seo-checklist.md](guides/seo-checklist.md) | Pre-production SEO checklist — metadata, sitemaps, structured data, assets |

### `decisions/` — Architecture Decision Records

| Doc | Status | Summary |
|-----|--------|---------|
| [ADR-001-kilpi-policy-organization.md](decisions/ADR-001-kilpi-policy-organization.md) | Proposed | Three-tier Kilpi authorization policy organization |

## Writing Guidelines

- Write in English
- Start each doc with a one-liner summary (`> description`)
- List core files at the top for quick navigation
- Use clear H1-H3 hierarchy with self-contained sections
- Use tables for structured data (parameters, options, file mappings)
- Include code examples for every pattern
- End with a **Rules** section for key constraints
- Keep sections scannable — prefer lists and code blocks over long paragraphs
