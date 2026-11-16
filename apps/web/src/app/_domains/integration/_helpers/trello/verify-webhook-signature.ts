import { createHmac, timingSafeEqual } from "crypto";

import { IntegrationConfigurationError } from "../../_services/integration-configuration-error";

/**
 * Trello signs the raw body followed by the callback URL it was registered
 * with, as a base64 HMAC-SHA1 keyed by the client secret. The callback URL is
 * part of the signed string, so a delivery replayed to another link's URL fails.
 */
export function verifyTrelloWebhookSignature(
  rawBody: string,
  callbackUrl: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.TRELLO_CLIENT_SECRET;
  if (!secret) {
    throw new IntegrationConfigurationError(
      "TRELLO_CLIENT_SECRET is not set. Configure it in .env.local with the secret from the OAuth 2.0 tab of your app at https://trello.com/apps/admin.",
    );
  }

  const expected = createHmac("sha1", secret)
    .update(rawBody + callbackUrl, "utf8")
    .digest("base64");

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
