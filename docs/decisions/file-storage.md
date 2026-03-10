# File Storage Architecture Decision

## Context

The project originally used AWS S3 (via Payload CMS) for media storage. This document records the decision to move to Vercel Blob as the default, with Cloudflare R2 as the migration path for larger projects.

## Decision: Vercel Blob as default, Cloudflare R2 for scale

### Why AWS S3 was dropped

- IAM is unnecessarily complex (users, roles, bucket policies, CORS config in JSON)
- Not a good default for a boilerplate — too much setup friction for clients
- Knowledge gap: getting it right requires AWS expertise most clients don't have

### Why not Uploadthing

- Proprietary file router pattern: migrating away requires a code rewrite
- Small company, longevity risk for a boilerplate
- Same lock-in problem as Vercel Blob, without the simplicity upside

---

## Default: Vercel Blob

**Use for**: small projects, early-stage apps, clients who are already on Vercel.

**Why**:
- Zero setup beyond creating a Vercel project — one env var (`BLOB_READ_WRITE_TOKEN`)
- No separate account or service for clients to manage
- Good enough for projects that don't store large volumes of files
- Pricing is simple and predictable at small scale

**Limitations to know**:
- Single read-write token — no fine-grained permission scoping
- `@vercel/blob` SDK is Vercel-specific: migrating away requires code changes + file migration
- Not a portable solution — accept this trade-off consciously for small projects

---

## Migration path: Cloudflare R2

**Use when**: the project stores significant volumes of files, or the client wants a portable storage solution.

**Why R2 over plain AWS S3**:
- S3-compatible API — the AWS SDK works unchanged, just swap the endpoint URL
- Much simpler than AWS: API tokens instead of IAM, no policy JSON, cleaner dashboard
- No egress fees (AWS charges per GB downloaded — significant at scale)
- Free tier: 10GB storage + 1M operations/month

**Security model** (simpler than AWS, better than Vercel Blob):
- Buckets are private by default
- For public media (images): set bucket to public, give the app a write-only token
- Result: public reads via URL, only the app can upload — no token needed for reads

**Portability**: because R2 uses the S3-compatible API, a client who later wants to move to AWS S3, DigitalOcean Spaces, Backblaze B2, or any other S3-compatible provider only needs to change env vars — no code changes.

### Migration from Vercel Blob to R2

1. Create a Cloudflare account and R2 bucket
2. Update the storage module to use the S3 SDK pointed at the R2 endpoint
3. Migrate existing files (use `rclone` or the Cloudflare dashboard bulk import)
4. Update env vars

---

## Implementation note

To make migration practical, keep storage interactions behind a thin abstraction — a module that exposes `uploadFile()`, `deleteFile()`, and `getFileUrl()`. This way, swapping the underlying provider is isolated to one file and a few env vars.
