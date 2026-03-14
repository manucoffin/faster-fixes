# Asset Storage System

> Provider-agnostic file and image storage with a centralized `Asset` table. Store keys instead of URLs — derive public URLs on demand.

## Core Files

| Layer           | Path                                    | Purpose                                          |
| --------------- | --------------------------------------- | ------------------------------------------------ |
| **DB schema**   | `packages/database/schema/asset.prisma` | `Asset` model — single source of truth for files |
| **URL builder** | `server/storage/build-asset-url.ts`     | `buildAssetUrl()` — derives public URL from key  |
| **DB helper**   | `server/storage/create-asset.ts`        | `createAsset()` — creates an Asset row           |
| **S3 client**   | `server/storage/index.ts`               | `better-upload` S3 client for presigned URLs     |
| **Upload API**  | `app/api/upload/route.ts`               | Presigned URL routes per upload context          |
| **Legacy**      | `lib/s3-client.ts`                      | Old `getS3FileUrl()` — prefer `buildAssetUrl()`  |

All `server/` and `app/` paths relative to `apps/web/src/`.

## Architecture

### Upload flow

```
Browser
   │
   ├─1─→  POST /api/upload (better-upload)
   │         └─→ Returns presigned S3 URL + key
   │
   ├─2─→  PUT to S3 presigned URL (direct upload)
   │
   └─3─→  tRPC mutation / server action
             └─→ createAsset({ key, bucket, ... })
                    └─→ Asset row in DB
```

### URL derivation

```
Asset row (key + provider + bucket)
        │
        ▼
  buildAssetUrl(asset)
        │
        ▼
  "https://{bucket}.s3.{region}.amazonaws.com/{key}"
```

No URL is stored in the database. The public URL is always derived from the asset's `key`, `provider`, and `bucket` fields plus the `AWS_REGION` env var.

## Asset Model

```prisma
model Asset {
    id        String   @id @default(uuid())
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    key      String   // storage path — see "Key Convention" below
    bucket   String   // bucket name at time of upload
    provider String   // "s3" | "r2" | "minio" (validated in app layer, not a DB enum)

    filename String   // original filename as uploaded by the user
    mimeType String   // "image/jpeg", "application/pdf", etc.
    size     Int      // file size in bytes

    width    Int?     // image-only
    height   Int?     // image-only
    alt      String?  // alt text for accessibility

    metadata Json?    // escape hatch for any extra data

    uploadedById String?
    uploadedBy   User?  @relation(...)
}
```

## Key Convention

The `key` field is the storage path within the bucket. Use this format:

```
{context}/{userId}/{uuid}.{extension}
```

| Segment     | Example             | Notes                                        |
| ----------- | ------------------- | -------------------------------------------- |
| `context`   | `profile-image`     | Matches the upload route name in `route.ts`  |
| `userId`    | `clx1abc...`        | Isolates files per user                      |
| `uuid`      | `550e8400-e29b-...` | Ensures uniqueness via `crypto.randomUUID()` |
| `extension` | `.jpg`, `.pdf`      | Derived from the uploaded file's MIME type   |

Examples of existing contexts (from `/api/upload`):

| Context                | Typical MIME types           |
| ---------------------- | ---------------------------- |
| `profile-image`        | `image/*`                    |
| `company-media`        | `image/*`                    |
| `organization-logo`    | `image/*`                    |
| `animal-profile-image` | `image/*`                    |
| `animal-media`         | `image/*`                    |
| `event-cover-image`    | `image/*`                    |
| `activity-image`       | `image/*`                    |
| `professional-records` | `image/*`, `application/pdf` |

## Usage

### Creating an Asset after upload

In a tRPC mutation or server action, once the client confirms the S3 upload:

```typescript
import { createAsset } from "@/server/storage/create-asset";
import { buildAssetUrl } from "@/server/storage/build-asset-url";

// Inside a mutation:
const asset = await createAsset({
  key: `profile-image/${ctx.user.id}/${crypto.randomUUID()}.jpg`,
  bucket: process.env.AWS_BUCKET_NAME!,
  provider: "s3",
  filename: "photo.jpg",
  mimeType: "image/jpeg",
  size: 204800,
  uploadedById: ctx.user.id,
});

// Derive the URL when needed (e.g. for API responses):
const url = buildAssetUrl(asset);
```

### Referencing an Asset from another model

Add a nullable `assetId` FK alongside the existing URL field during migration:

```prisma
model CompanyProfile {
    // Legacy — keep during migration
    image String?

    // New — populate for new uploads
    imageAssetId String?
    imageAsset   Asset?  @relation(fields: [imageAssetId], references: [id])
}
```

In queries, resolve the URL:

```typescript
const profile = await prisma.companyProfile.findUnique({
  where: { id },
  include: { imageAsset: true },
});

const imageUrl = profile.imageAsset
  ? buildAssetUrl(profile.imageAsset)
  : profile.image; // legacy fallback
```

### Adding a new storage provider

1. Add a new `case` in `build-asset-url.ts`:

```typescript
case "r2":
  return `${process.env.R2_PUBLIC_URL}/${asset.key}`;
```

2. Add the env var to `.env.example`.

## Migration Strategy

For each model that currently stores a raw URL:

1. Add a nullable `assetId` FK field alongside the existing URL field
2. New uploads → create an Asset row, populate `assetId`
3. Backfill existing rows (optional script) → create Asset rows from old URLs, extract the key
4. Once all rows migrated → drop the old URL column

## Design Decisions

| Decision                         | Rationale                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Store `key` not URL              | Provider portability — switch S3 → R2 without data migration                                      |
| `provider` as String, not enum   | Adding a provider doesn't require a DB migration                                                  |
| Asset has no polymorphic "owner" | The referencing model holds the FK — keeps Asset a pure storage abstraction                       |
| No image variants modeled        | Use a transformation CDN (imgix, Cloudflare Images) later — derive variant URLs from the same key |
| `bucket` stored per-asset        | Supports multi-bucket setups and preserves the exact bucket used at upload time                   |

### Why Asset creation happens in the tRPC mutation, not in a better-upload hook

`better-upload` provides two server hooks: `onBeforeUpload` (before presigned URL generation) and `onAfterSignedUrl` (after presigned URL generation, **before** the client uploads). There is no `onUploadComplete` server-side callback.

If we created the Asset row in `onAfterSignedUrl`, the record would exist before the file is actually in S3. If the client never completes the upload (network failure, page close), we'd have an Asset row pointing to nothing — a guaranteed orphan, not a rare edge case.

By creating the Asset in the tRPC mutation (step 3 of the upload flow), the client only calls the mutation after the S3 upload succeeds, so we know the file exists.

Additional benefits of the tRPC mutation approach:

- **Auth context**: full access to `ctx.user`, `ctx.organization`, etc.
- **Business logic**: validation (e.g. media count limits) stays in the mutation where it belongs
- **Atomicity**: the mutation can create the Asset + update the parent model in a single Prisma transaction

### Why we don't upload files through the server (inside the tRPC mutation)

An alternative would be to pass the file to the tRPC mutation and upload to S3 server-side, gaining "atomicity" between upload and DB write. We chose not to do this because:

1. **Double bandwidth**: the file would travel client → server → S3 instead of client → S3 directly via presigned URL
2. **Server memory pressure**: the Next.js server/serverless function would hold entire files in memory (up to 10MB per upload)
3. **Longer mutations**: the mutation would block on S3 upload time, risking timeouts on slow connections
4. **Atomicity is an illusion**: even with server-side upload, if the DB write fails after the S3 upload, the orphan problem remains — S3 and Postgres are separate systems with no shared transaction

### Orphan files in the bucket

The current flow (client → S3, then tRPC mutation) can leave orphan files if the S3 upload succeeds but the tRPC mutation fails (server error, network drop, user closes tab). This is **accepted and expected**:

- Orphans are rare — the mutation only fails if there's a server error or the user leaves between upload completion and mutation call
- Storage cost is negligible — a few orphaned images cost fractions of a cent
- If orphans ever become a concern, add a scheduled cleanup job (Inngest cron) that scans the bucket for keys with no matching Asset row and deletes them after a 24h grace period
- This is a standard pattern used by most systems with object storage (Stripe, Cloudflare, AWS)
