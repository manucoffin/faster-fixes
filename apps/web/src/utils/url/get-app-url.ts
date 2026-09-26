/**
 * Gets the base URL for the application based on the current environment.
 * - Development: http://localhost:3000
 * - Preview (Vercel): https://{VERCEL_URL}
 * - Production: BASE_URL or VERCEL_PRODUCTION_URL
 */
export function getAppUrl(): string {
  // An empty BASE_URL counts as unset, so it falls through to the fallbacks below.
  const baseUrl = process.env.BASE_URL ?? "";

  // Production environment
  if (process.env.VERCEL_ENV === "production") {
    // Use VERCEL_PROJECT_PRODUCTION_URL if available, otherwise fall back to BASE_URL
    return process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : baseUrl;
  }

  // Preview environment (Vercel staging/preview deployments)
  if (process.env.VERCEL_ENV === "preview") {
    // return `https://${process.env.VERCEL_URL}`;
    return baseUrl === "" ? `https://${process.env.VERCEL_URL}` : baseUrl;
  }

  // Fallback for any other environment (eg. development)
  return baseUrl === "" ? "http://localhost:3000" : baseUrl;
}
