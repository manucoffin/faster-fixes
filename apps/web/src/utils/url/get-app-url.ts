/**
 * Gets the base URL for the application based on the current environment.
 * - Development: http://localhost:3000
 * - Preview (Vercel): https://{VERCEL_URL}
 * - Production: BASE_URL or VERCEL_PRODUCTION_URL
 */
export function getAppUrl(): string {
  // Production environment
  if (process.env.VERCEL_ENV === "production") {
    // Use VERCEL_PROJECT_PRODUCTION_URL if available, otherwise fall back to BASE_URL
    return process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.BASE_URL || "";
  }

  // Preview environment (Vercel staging/preview deployments)
  if (process.env.VERCEL_ENV === "preview") {
    // return `https://${process.env.VERCEL_URL}`;
    return process.env.BASE_URL || `https://${process.env.VERCEL_URL}`;
  }

  // Fallback for any other environment (eg. development)
  return process.env.BASE_URL || "http://localhost:3000";
}
