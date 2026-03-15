# SEO Pre-Production Checklist

> Everything to verify and complete before going live. The boilerplate ships with most of the infrastructure — this guide tells you what to fill in and what to double-check.

## Core Files

| Layer                | Path                                        | Purpose                                            |
| -------------------- | ------------------------------------------- | -------------------------------------------------- |
| **Root metadata**    | `apps/web/src/app/layout.tsx`               | Default title template, OG image, Twitter card     |
| **SEO constants**    | `apps/web/src/app/_constants/seo.ts`        | `SITE_NAME`, `SITE_META_DESCRIPTION`, OG image URL |
| **App constants**    | `apps/web/src/app/_constants/app.ts`        | `APP_URL`, support/contact emails                  |
| **Company data**     | `apps/web/src/app/_constants/company.ts`    | Address, social links                              |
| **Robots**           | `apps/web/src/app/robots.ts`                | Crawl directives, sitemap reference                |
| **Sitemap (root)**   | `apps/web/src/app/sitemap.ts`               | Static public pages                                |
| **Sitemap (blog)**   | `apps/web/src/app/(public)/blog/sitemap.ts` | Dynamic blog post sitemap                          |
| **Manifest**         | `apps/web/src/app/manifest.ts`              | PWA manifest (name, icons, theme)                  |
| **Security headers** | `apps/web/next.config.mjs`                  | `X-Content-Type-Options`, `X-Frame-Options`, etc.  |
| **JSON-LD schemas**  | `apps/web/src/app/_features/seo/`           | Organization, Website, Breadcrumb, FAQ, Person     |

## Checklist

### 1. Update placeholder values

- [ ] `_constants/seo.ts` — set `SITE_NAME` and `SITE_META_DESCRIPTION` to real values
- [ ] `_constants/app.ts` — set `SUPPORT_EMAIL` and `CONTACT_EMAIL`
- [ ] `_constants/company.ts` — set real address and social media URLs
- [ ] Verify `BASE_URL` / `VERCEL_PROJECT_PRODUCTION_URL` env vars are set for production

### 2. Add static assets

- [ ] `public/favicon.ico` — 32x32 favicon
- [ ] `public/apple-touch-icon.png` — 180x180 Apple touch icon
- [ ] `public/icon-192x192.png` — 192x192 PWA icon
- [ ] `public/icon-512x512.png` — 512x512 PWA icon
- [ ] `public/images/og-image.jpg` — 1200x630 default Open Graph image

### 3. Per-page metadata

Every public page should export a `metadata` object (or `generateMetadata` for dynamic pages):

```typescript
import { APP_URL } from "@/app/_constants/app";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title", // becomes "Page Title - Site Name" via template
  description: "Page-specific description with target keyword.",
  alternates: {
    canonical: `${APP_URL}/page-slug`,
  },
};
```

Checklist per page:

- [ ] `title` — unique, keyword near the start, 50-60 characters
- [ ] `description` — unique, compelling, 150-160 characters
- [ ] `alternates.canonical` — absolute URL pointing to self
- [ ] OG image override if the page has a specific visual (optional — falls back to root default)

### 4. Sitemap

- [ ] Add every new public route to `src/app/sitemap.ts`
- [ ] Blog sitemap is auto-generated from Payload CMS — no action needed
- [ ] Verify both sitemaps are accessible at `/sitemap.xml` and `/blog/sitemap.xml`

### 5. Robots & indexation

- [ ] `robots.ts` disallows `/api/` and `/admin/` — add any other private routes
- [ ] Authenticated layout (`(authenticated)/layout.tsx`) has `robots: { index: false, follow: false }`
- [ ] Admin layout (`admin/layout.tsx`) has `robots: { index: false, follow: false }`
- [ ] Auth pages (login, signup, forgot password) — decide whether to index or noindex

### 6. JSON-LD structured data

The boilerplate includes ready-to-use schema components. Render them on the appropriate pages:

| Schema               | Where to use               | Component                           |
| -------------------- | -------------------------- | ----------------------------------- |
| `OrganizationSchema` | Homepage                   | `_features/seo/organization-schema` |
| `WebSiteSchema`      | Homepage                   | `_features/seo/website-schema`      |
| `BreadcrumbSchema`   | Every public page          | `_features/seo/breadcrumb-schema`   |
| `FAQSchema`          | FAQ / pricing pages        | `_features/seo/faq-schema`          |
| `ArticleSchema`      | Blog posts (already wired) | `blog/_features/seo/article-schema` |

Example for the homepage:

```tsx
import { OrganizationSchema } from "@/app/_features/seo/organization-schema";
import { WebSiteSchema } from "@/app/_features/seo/website-schema";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";

export default function HomePage() {
  return (
    <div>
      {/* page content */}
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: "Accueil", url: APP_URL }]} />
    </div>
  );
}
```

### 7. Images

- [ ] All `<Image>` components have a descriptive `alt` prop
- [ ] Use Next.js `<Image>` (not `<img>`) for automatic optimization (AVIF/WebP, lazy loading, responsive srcset)
- [ ] Large hero images use `priority` prop to avoid LCP delays

### 8. Headings

- [ ] One `<h1>` per page — contains the primary keyword
- [ ] Logical hierarchy: H1 > H2 > H3 (no skipping levels)

### 9. Performance (Core Web Vitals)

- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/) on key pages
- [ ] LCP < 2.5s — check largest element loads fast (hero image, heading)
- [ ] CLS < 0.1 — no layout shifts (set explicit width/height on images, use font `display: swap`)
- [ ] INP < 200ms — interactive elements respond quickly

### 10. Security & HTTPS

- [ ] HTTPS enforced (Vercel handles this by default)
- [ ] Security headers present in `next.config.mjs` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)
- [ ] No mixed content (all resources loaded over HTTPS)

### 11. Final verification

- [ ] `site:yourdomain.com` in Google — check indexed pages make sense
- [ ] Submit sitemap in [Google Search Console](https://search.google.com/search-console)
- [ ] Test OG tags with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Test Twitter cards with [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] Validate structured data with [Rich Results Test](https://search.google.com/test/rich-results)

## Rules

- Every public page must have a unique `title` and `description`
- Every public page must have a canonical URL
- Never index authenticated or admin routes
- Always add new public routes to `sitemap.ts`
- Use the `%s - Site Name` title template — don't manually append the site name
- OG image defaults are inherited from root layout — only override when a page has a specific visual
