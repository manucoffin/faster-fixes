/**
 * Environment utilities for robust environment detection
 * Provides flexible and type-safe environment checking
 */

export type Environment = "production" | "preview" | "development" | "test";

export type EnvironmentInfo = {
  environment: Environment;
  isProduction: boolean;
  isPreview: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  isVercel: boolean;
  isLocal: boolean;
};

/**
 * Determines the current environment based on various environment variables
 * Checks multiple sources for robust detection:
 * - VERCEL_ENV (Vercel-specific)
 * - NODE_ENV (standard)
 * - NODE_ENV fallback patterns
 */
function detectEnvironment(): Environment {
  // Check Vercel-specific environment first (most reliable on Vercel)
  if (process.env.VERCEL_ENV) {
    switch (process.env.VERCEL_ENV) {
      case "production":
        return "production";
      case "preview":
        return "preview";
      case "development":
        return "development";
      default:
        // Fallback for unknown VERCEL_ENV values
        break;
    }
  }

  // Fallback to NODE_ENV
  switch (process.env.NODE_ENV) {
    case "production":
      return "production";
    case "test":
      return "test";
    case "development":
    default:
      return "development";
  }
}

/**
 * Gets comprehensive environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const environment = detectEnvironment();
  const isVercel = Boolean(process.env.VERCEL);

  return {
    environment,
    isProduction: environment === "production",
    isPreview: environment === "preview",
    isDevelopment: environment === "development",
    isTest: environment === "test",
    isVercel,
    isLocal: !isVercel,
  };
}

/**
 * Quick check if we're in development environment
 */
export function isDevelopment(): boolean {
  return getEnvironmentInfo().isDevelopment;
}

/**
 * Check if this is the official cloud-hosted instance.
 * Self-hosted instances leave NEXT_PUBLIC_IS_CLOUD unset or "false",
 * which disables marketing pages (home, pricing, blog, docs, legal).
 */
export function isCloud(): boolean {
  return process.env.NEXT_PUBLIC_IS_CLOUD === "true";
}
