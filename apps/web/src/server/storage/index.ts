import "server-only";

import { cloudflare } from "@better-upload/server/clients";

// `?? ""` rather than `requireEnv`: this client is built at import, and throwing
// there would break `next build` and test imports that run without R2 env.
export const s3Client = cloudflare({
  accountId: process.env.R2_ACCOUNT_ID ?? "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
});
