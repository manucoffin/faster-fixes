# Video quota cost model (Cloudflare R2)

> Cost model for storing uploaded Videos on Cloudflare R2, with recommended per-plan quotas. Research for #305, part of the Video review map #301. Prices verified on 2026-11-03.

Core files:

| File                                                                    | Role                                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/web/src/app/_domains/subscription/_helpers/subscription-plans.ts` | `PLAN_LIMITS`, `PLAN_PRICES`: where the quota values go                |
| `apps/web/src/server/auth/subscription/check-resource-limit.ts`         | Count-based limit check (`current < limit`, `Infinity` short-circuits) |
| `apps/web/src/server/auth/subscription/resolve-organization-plan.ts`    | Self-hosted (`!isCloud()`) resolves to Agency limits                   |
| `apps/web/src/app/api/v1/feedback/_services/get-feedback-capacity.ts`   | Shape of a capacity answer (`allowed`, `current`, `limit`)             |
| `apps/web/src/app/api/upload/route.ts`                                  | better-upload routes with `maxFileSize` and `onBeforeUpload` guards    |

## Summary

- R2 storage is USD 0.015 per GB-month, egress is free, and the free tier covers 10 GB-month plus 1M Class A and 10M Class B operations per month. Operations stay inside the free tier at any realistic scale; storage is the only cost that moves.
- The realistic fleet in the ticket (50 free orgs x 1 video, 20 pro x 5, 5 agency x 30) costs USD 1.20 / 4.35 / 8.85 per month at 300 MB / 1 GB / 2 GB average file size, against USD 895 of monthly subscription revenue.
- The lever that bounds cost is a per-Organization storage budget in GB. A Video count and a max file size are needed as upload-time guards, but on their own they only bound cost as their product. Duration does not bound bytes (bitrate varies 5 to 68 Mbps). Retention only matters for abandoned Organizations, not for the monthly bill.
- Competitor free tiers are 1 to 2 GB (Frame.io 2 GB, Filestage 2 GB, Ziflow 2 GB, Ruttl 1 GB; Markup.io has no free plan), so a 1 GB free budget matches expectations.

| Plan   | Videos per Organization | Max size per file | Storage budget per Organization | Duration cap | Retention      | Worst-case cost per Organization per month |
| ------ | ----------------------- | ----------------- | ------------------------------- | ------------ | -------------- | ------------------------------------------ |
| Free   | 3                       | 500 MB            | 1 GB                            | none         | none at launch | USD 0.015                                  |
| Pro    | 25                      | 2 GB              | 20 GB                           | none         | none           | USD 0.30 (1.5% of USD 20)                  |
| Agency | 100                     | 4 GB              | 100 GB                          | none         | none           | USD 1.50 (1.5% of USD 99)                  |

Worst case for the ticket's fleet with every Organization maxed out: 950 GB, USD 14.10 per month (1.6% of revenue). Self-hosted resolves to Agency and pays its own storage, so these caps are a guard there, not a cost. No `Infinity` on any video limit, since Agency is also the cloud top plan.

## Verified R2 pricing

All from https://developers.cloudflare.com/r2/pricing/ (Standard storage class), read on 2026-11-03.

| Item                                                                                       | Price                   | Free tier per month |
| ------------------------------------------------------------------------------------------ | ----------------------- | ------------------- |
| Storage                                                                                    | USD 0.015 per GB-month  | 10 GB-month         |
| Class A operations (PutObject, UploadPart, CreateMultipartUpload, CompleteMultipartUpload) | USD 4.50 per million    | 1 million           |
| Class B operations (GetObject, HeadObject)                                                 | USD 0.36 per million    | 10 million          |
| DeleteObject, AbortMultipartUpload                                                         | free                    | n/a                 |
| Egress to the internet                                                                     | free, any storage class | n/a                 |

Metering: "A GB-month is calculated by averaging the peak storage per day over a billing period (30 days)". So a Video kept 10 days out of 30 costs one third of a full month, and the bill follows the average stock, not the number of uploads. Standard storage has no minimum duration. Infrequent Access (USD 0.01 per GB-month, 30-day minimum, USD 0.01 per GB retrieval, no free tier) is not worth it for review videos that are read right after upload.

Cloudflare Stream, for the record: USD 5 per 1,000 minutes stored per month plus USD 1 per 1,000 minutes delivered (https://developers.cloudflare.com/stream/pricing/). 100 videos of 10 minutes viewed 20 times each is USD 5 + USD 20 = USD 25 per month on Stream against about USD 0.60 on R2 for the same 100 x 500 MB files. The "about 15x" charting fact holds in order of magnitude; the exact ratio depends on bitrate.

## Scenario cost table

Assumptions: Videos are kept the whole month (steady state), every file is the scenario's average size, the 10 GB free tier is applied once at the account level. Cost = max(0, total GB - 10) x 0.015.

| Scenario                                | Videos | 300 MB avg | 1 GB avg | 2 GB avg |
| --------------------------------------- | ------ | ---------- | -------- | -------- |
| 50 free orgs x 1 video                  | 50     | 15 GB      | 50 GB    | 100 GB   |
| 20 pro orgs x 5 videos                  | 100    | 30 GB      | 100 GB   | 200 GB   |
| 5 agency orgs x 30 videos               | 150    | 45 GB      | 150 GB   | 300 GB   |
| Total stock                             | 300    | 90 GB      | 300 GB   | 600 GB   |
| Monthly R2 cost (after free tier)       |        | USD 1.20   | USD 4.35 | USD 8.85 |
| Monthly R2 cost (no free tier)          |        | USD 1.35   | USD 4.50 | USD 9.00 |
| Subscription revenue (20 x 20 + 5 x 99) |        | USD 895    | USD 895  | USD 895  |
| Storage as share of revenue             |        | 0.13%      | 0.49%    | 0.99%    |

Same fleet at 10x (500 free, 200 pro, 50 agency, 3,000 Videos): 900 GB / 3 TB / 6 TB, USD 13.35 / 44.85 / 88.50 per month against USD 8,950 revenue. The ratio stays under 1%.

General formula, per month, for an Organization fleet:

```
cost = 0.015 x max(0, sum over orgs(videos x avgSizeGB x retainedDays / 30) - 10)
```

## Which lever bounds cost

| Lever                        | Bounds bytes?                                         | Verdict                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Video count per Organization | Only together with a max file size (count x max size) | Needed for the list UX and as a cheap count check, loose as a cost bound                                                                                                       |
| Max size per file            | Only together with a count                            | Needed as an upload-time guard (`maxFileSize` on the route rejects before any byte is sent), loose alone                                                                       |
| Total GB per Organization    | Yes, directly: worst case = orgs x budget x 0.015     | The lever to put in `PLAN_LIMITS`; the only one whose worst case is a single multiplication                                                                                    |
| Retention in days            | Scales the monthly stock by retainedDays / 30         | Does not bound a single month (a 30-day retention is a full month); only bounds accumulation of abandoned Organizations over time                                              |
| Max duration                 | No                                                    | Bitrate ranges 5 Mbps (720p) to 68 Mbps (4K 60 fps) per YouTube's recommended settings, so 10 minutes is 375 MB or 5.1 GB; a duration cap is a player decision, not a cost one |

Why the GB budget wins: the count and the per-file size are what the user sees and what the upload route can enforce before the transfer, but a user who maxes both pays exactly count x size, and the human picking numbers has to reason about a product. A storage budget turns the worst case into `orgs x budget`, is the unit every competitor prices in, and is what a sum query over the stored size per Organization answers in one call. The recommendation keeps all three (count, size, budget) because each guards a different moment: the count guards the create, the size guards the presign, the budget guards both.

Size-to-duration translation, H.264 MP4 at YouTube's recommended SDR bitrates (https://support.google.com/youtube/answer/1722171), to read the caps as minutes:

| File size | 720p 30 fps (5 Mbps, 37.5 MB/min) | 1080p 30 fps (8 Mbps, 60 MB/min) | 4K 30 fps (45 Mbps, 337 MB/min) |
| --------- | --------------------------------- | -------------------------------- | ------------------------------- |
| 500 MB    | 13 min                            | 8 min                            | 1.5 min                         |
| 2 GB      | 53 min                            | 33 min                           | 6 min                           |
| 4 GB      | 107 min                           | 67 min                           | 12 min                          |

Screen recordings from macOS or OBS are usually encoded well below these bitrates (UNVERIFIED, no primary source), so the minutes above are a floor for the typical review clip.

## Competitor free tiers and user expectations

| Tool      | Free plan storage | Other free limits                                                                                              | Source                         |
| --------- | ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Frame.io  | 2 GB              | 2 members, 2 projects                                                                                          | https://frame.io/pricing       |
| Filestage | 2 GB              | 1 active project, 5 new files per month                                                                        | https://filestage.io/pricing/  |
| Ziflow    | 2 GB              | 2 users, 60 days review history, unlimited proofs "limited only by the amount of storage you've been allotted" | https://www.ziflow.com/pricing |
| Ruttl     | 1 GB (Basic)      | 1 project; Pro at USD 18 per user is 50 GB                                                                     | https://ruttl.com/pricing/     |
| Markup.io | no free plan      | Pro from USD 79 per month with 100 to 200 GB and 50 to 100 MarkUps per month                                   | https://www.markup.io/pricing/ |

Takeaways: every competitor that has a free plan prices it in GB, not in file count, and lands on 1 to 2 GB; none advertises a per-file size or a duration cap on the plan page (the Frame.io, Filestage, Ziflow and Ruttl pages do not state one). Ziflow is the only one with a time cap (60 days of review history on Free). Paid tiers jump to 50 GB (Ruttl Pro, USD 18 per user) and 100 to 200 GB (Markup.io Pro, USD 79), so a 20 GB Pro budget at USD 20 is in range for the price and a 100 GB Agency budget matches the USD 79 to 99 bracket.

## Recommended quotas

| Plan   | `videos` | `videoMaxFileSize` | `videoStorage` | Rationale                                                                                                                                                                                                                                                                |
| ------ | -------- | ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Free   | 3        | 500 MB             | 1 GB           | Enough to try the feature on a real clip (8 min at 1080p), under the 2 GB competitors give; a maxed-out free Organization costs USD 0.015 per month, and 10,000 abandoned free Organizations at 1 GB cost USD 150 per month, the only scenario retention would help with |
| Pro    | 25       | 2 GB               | 20 GB          | 33 min at 1080p per file; a maxed-out Pro Organization costs USD 0.30 per month, 1.5% of the plan                                                                                                                                                                        |
| Agency | 100      | 4 GB               | 100 GB         | 67 min at 1080p per file, under R2's 5 GiB single-request ceiling so multipart stays an optimisation rather than a requirement; a maxed-out Agency Organization costs USD 1.50 per month, 1.5% of the plan                                                               |

Duration cap: none. Bytes are what cost money and the size cap already bounds them; the player ticket can add a duration limit for its own reasons.

Retention: none at launch, on every plan. The monthly bill is bounded by `videoStorage` regardless of retention, and deleting a file from under its Feedback is a product question (the map lists "Deleting a Video" as not yet specified). If abandoned free Organizations become a measurable stock, a 90-day expiry on free-plan Videos is the first thing to add; Ziflow's 60-day review history shows users accept it on a free plan.

Fitting `PLAN_LIMITS`: `videos` is a count per Organization and works with `checkResourceLimit` as is (one more `RESOURCE_COUNT_QUERIES` entry). `videoMaxFileSize` is read by the upload route's `maxFileSize` and does not need a query. `videoStorage` is a sum of stored sizes per Organization plus the incoming file, so it needs a sibling of `checkResourceLimit` that compares `currentBytes + incomingBytes <= limit` rather than `current < limit`; it should run in `onBeforeUpload` so a refused upload costs nothing. None of the three should be `Infinity`, since Agency is both the cloud top plan and the self-hosted fallback.

Worst case if every Organization maxes out, for the ticket's fleet: 50 x 1 GB + 20 x 20 GB + 5 x 100 GB = 950 GB, (950 - 10) x 0.015 = USD 14.10 per month against USD 895 of revenue. At 10x the fleet: 9.5 TB, USD 142.35 per month against USD 8,950.

Self-hosted: `resolveOrganizationPlan` returns Agency limits off cloud, so a self-hosted Organization gets 100 Videos, 4 GB per file, 100 GB. The operator's own bucket (R2, S3, MinIO or local disk through `apps/web/src/server/storage/`) carries the bytes, so the caps protect the instance from one runaway Organization rather than a bill. An operator who wants more can raise them later through an environment override; that is a separate decision.

## Storage operation costs

better-upload (`@better-upload/server` 3.0.14, the version installed) uploads a multipart file as one `CreateMultipartUpload`, one `UploadPart` per part with a presigned PUT per part, and one `CompleteMultipartUpload` POST; on failure the client sends a DELETE to the abort URL. The default `partSize` is 52,428,800 bytes (50 MB) and `multipartBatchSize` has no numeric default (all parts in flight at once unless set). Sources: https://github.com/Nic13Gamer/better-upload/blob/main/apps/docs/content/docs/routes-single.mdx and https://github.com/Nic13Gamer/better-upload/blob/main/packages/client/src/utils/internal/s3-upload.ts. R2 requires every part except the last to be at least 5 MiB and all parts except the last to be the same size, with at most 10,000 parts (https://developers.cloudflare.com/r2/objects/multipart-objects/); the 50 MB default satisfies both.

Upload, Class A per file at the 50 MB default part size:

| File size | Parts | Class A ops |
| --------- | ----- | ----------- |
| 500 MB    | 10    | 12          |
| 2 GB      | 40    | 42          |
| 4 GB      | 80    | 82          |

The ticket's fleet (300 Videos per month, all at 4 GB) is 24,600 Class A, 2.5% of the free 1M. Ten thousand 4 GB uploads per month is 820,000, still inside the free tier; past it, Class A costs USD 4.50 per million, so a million extra uploads of 2 GB would add USD 189. Presigning is a local signature, not an operation.

Playback: the `<video>` element fetches by HTTP range requests, and each range request against a presigned URL is one GetObject (Class B). The number of range requests per view depends on the browser's buffering and on how much the Reviewer scrubs; order of tens to a few hundred per view (UNVERIFIED, browser behaviour, no primary source gives a number). At 100 per view, 300 Videos viewed 20 times each is 600,000 Class B per month, 6% of the free 10M. Exhausting the free tier takes 100,000 views per month, and the next 10M views at 100 requests each cost USD 360. A `HeadObject` to confirm size after upload is one more Class B per Video. Delete and abort are free.

Incomplete uploads: R2 buckets carry a default lifecycle rule that aborts multipart uploads 7 days after initiation, and a custom `AbortIncompleteMultipartUpload` rule with `DaysAfterInitiation` can be scoped to a prefix (https://developers.cloudflare.com/r2/buckets/object-lifecycles/). The pricing page does not say whether in-progress parts count toward storage (UNVERIFIED); the multipart guide's Workers example aborts "to clean up incomplete parts" and implies they do. A 1-day abort rule on the video prefix is cheap insurance and worth a line in the implementation ticket; it does not change the cost model either way, since a stalled 4 GB upload held 7 days is USD 0.014.

Conclusion: operations stay within the free tier at any volume the quotas allow; storage is the only line that moves, and it is bounded by `videoStorage`.

## Sources

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/ (storage, operation classes, free tier, egress, GB-month metering)
- Cloudflare R2 limits: https://developers.cloudflare.com/r2/platform/limits/ (5 GiB per single upload request, 10,000 parts)
- Cloudflare R2 multipart objects: https://developers.cloudflare.com/r2/objects/multipart-objects/ (5 MiB minimum part, equal part sizes, abort semantics)
- Cloudflare R2 object lifecycles: https://developers.cloudflare.com/r2/buckets/object-lifecycles/ (7-day default abort of incomplete multipart uploads)
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- Frame.io pricing: https://frame.io/pricing
- Filestage pricing: https://filestage.io/pricing/
- Ruttl pricing: https://ruttl.com/pricing/
- Markup.io pricing: https://www.markup.io/pricing/
- Ziflow pricing: https://www.ziflow.com/pricing
- YouTube recommended upload encoding settings (bitrate table): https://support.google.com/youtube/answer/1722171
- better-upload route options (multipart `partSize` default): https://github.com/Nic13Gamer/better-upload/blob/main/apps/docs/content/docs/routes-single.mdx
- better-upload client multipart flow: https://github.com/Nic13Gamer/better-upload/blob/main/packages/client/src/utils/internal/s3-upload.ts
- Local: `apps/web/src/app/_domains/subscription/_helpers/subscription-plans.ts`, `apps/web/src/server/auth/subscription/check-resource-limit.ts`, `apps/web/src/server/auth/subscription/resolve-organization-plan.ts`, `apps/web/src/app/api/upload/route.ts`

## Rules

- Put the storage budget (`videoStorage`) in `PLAN_LIMITS`; count and per-file size are guards, not the cost bound.
- No `Infinity` on video limits: Agency is the self-hosted fallback and the cloud top plan.
- Check the budget in `onBeforeUpload`, before any byte reaches the bucket.
- Add a 1-day `AbortIncompleteMultipartUpload` lifecycle rule on the video prefix.
- Revisit retention only if abandoned free-plan stock becomes measurable.
