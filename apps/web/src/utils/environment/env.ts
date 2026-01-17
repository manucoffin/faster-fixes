/**
 * Environment utilities for robust environment detection
 * Provides flexible and type-safe environment checking
 */

export type Environment = 'production' | 'preview' | 'development' | 'test';

export interface EnvironmentInfo {
  environment: Environment;
  isProduction: boolean;
  isPreview: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  isVercel: boolean;
  isLocal: boolean;
}

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
      case 'production':
        return 'production';
      case 'preview':
        return 'preview';
      case 'development':
        return 'development';
      default:
        // Fallback for unknown VERCEL_ENV values
        break;
    }
  }

  // Fallback to NODE_ENV
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'production';
    case 'test':
      return 'test';
    case 'development':
    default:
      return 'development';
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
    isProduction: environment === 'production',
    isPreview: environment === 'preview',
    isDevelopment: environment === 'development',
    isTest: environment === 'test',
    isVercel,
    isLocal: !isVercel,
  };
}

/**
 * Quick check if we're in production environment
 */
export function isProduction(): boolean {
  return getEnvironmentInfo().isProduction;
}

/**
 * Quick check if we're in preview environment (Vercel previews)
 */
export function isPreview(): boolean {
  return getEnvironmentInfo().isPreview;
}

/**
 * Quick check if we're in development environment
 */
export function isDevelopment(): boolean {
  return getEnvironmentInfo().isDevelopment;
}

/**
 * Quick check if we're in test environment
 */
export function isTest(): boolean {
  return getEnvironmentInfo().isTest;
}

/**
 * Quick check if we're running on Vercel (any environment)
 */
export function isVercel(): boolean {
  return getEnvironmentInfo().isVercel;
}

/**
 * Quick check if we're running locally (not on Vercel)
 */
export function isLocal(): boolean {
  return getEnvironmentInfo().isLocal;
}

/**
 * Check if we're in a "safe" environment for debugging/development features
 * Returns true for development, preview, and test environments
 */
export function isSafeForDebugging(): boolean {
  const env = getEnvironmentInfo();
  return env.isDevelopment || env.isPreview || env.isTest;
}