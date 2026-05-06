import { createHmac, timingSafeEqual } from "crypto";

export function verifyLinearWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.LINEAR_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "LINEAR_WEBHOOK_SIGNING_SECRET is not set. Configure it in .env.local with the value from Linear's OAuth app settings.",
    );
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
