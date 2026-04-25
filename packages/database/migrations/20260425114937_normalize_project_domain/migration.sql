-- Normalize existing project URLs to bare domains:
-- strip protocol, path, query, fragment, port, and leading "www.".
-- Column is still named "url" in SQL (kept via @map); the Prisma field is
-- "domain" and now treats the value as a normalized hostname.
UPDATE "project"
SET "url" = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(trim("url")), '^[a-z][a-z0-9+.-]*://', ''),
          '/.*$', ''
        ),
        '\?.*$', ''
      ),
      '#.*$', ''
    ),
    ':\d+$', ''
  ),
  '^www\.', ''
)
WHERE "url" IS NOT NULL;
