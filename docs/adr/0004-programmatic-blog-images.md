# Blog OG and featured images are generated from a template, not authored per post

Each blog post's OG image and in-article featured image are the same dynamically-rendered card served by an edge `ImageResponse` Route Handler at `/blog/[slug]/og`. The frontmatter does not carry a `featuredImage` field; the slug is the identity and the title is the only content variable.

## Why

The minimum-friction path for a solo founder who writes posts irregularly. Removing per-post artwork eliminates a decision point ("what image should this post have?") that previously blocked publishing. The template doubles as the OG card and the in-article hero, so one render path serves two surfaces. Cache headers (`s-maxage=86400, stale-while-revalidate=604800`) make the runtime cost negligible after first hit, and a fluid font ladder (96/80/64/52 px by title length) absorbs long SEO titles without truncation.

## Consequences

- Adding bespoke artwork for a single post requires re-introducing a `featuredImage` override field and deciding template-vs-override semantics. Do not do this lightly — the absence of the field is the decision.
- Changing the template affects every historical post on next CDN refresh (within ~24h). There is no per-post versioning; this is intentional, since the template is the brand and posts should look consistent across time.
- The Space Grotesk 700 `.ttf` is committed at `apps/web/src/app/(public)/blog/[slug]/og/_fonts/space-grotesk-bold.ttf` so the edge function bundles it; files under `public/fonts/` would require a runtime HTTP hop back to the CDN.
- Hand-authored PNGs under `apps/web/public/blog/` are dead after rollout and should be deleted.

## Amendment 2026-11-14: one `/og` route for every public page

The decision stands: a blog post's card is still rendered from its title, with no `featuredImage` field. The route that renders it moved. Every public page now takes its social card from one Route Handler, `apps/web/src/app/og/[[...path]]/route.tsx`, and a blog post's card is served at `/og/blog/<slug>`, which is also the in-article hero. Static pages read their copy from `OG_CARDS` in `apps/web/src/app/og/_helpers/og-cards.ts`; blog posts and docs pages from their frontmatter.

- The route runs on Node, not edge: the Fumadocs sources it reads resolve MDX files from disk with `node:fs`.
- The font is committed at `apps/web/src/app/og/_fonts/space-grotesk-bold.ttf` and read from disk once per cold start.
- The cache headers are unchanged.
