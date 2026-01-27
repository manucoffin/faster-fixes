/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  typedRoutes: true,

  experimental: {
    authInterrupts: true,
  },

  // Exclude server-only packages from bundling to prevent Turbopack errors
  serverExternalPackages: [
    "@payloadcms/db-postgres",
    "drizzle-kit",
    "drizzle-orm",
    "@libsql/client",
    "postgres",
    "pg-native",
    "esbuild",
    "esbuild-register",
  ],

  images: {
    // Optimize image formats for better performance
    formats: ["image/avif", "image/webp"],
    // Configure quality levels for different use cases
    qualities: [25, 50, 75, 90],
    // Responsive device sizes for srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Additional image sizes for smaller images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Longer cache TTL for production performance
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      // Google profile pictures
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },

      // S3 buckets
      {
        protocol: "https",
        hostname: "startup-maker-dev.s3.eu-west-3.amazonaws.com",
      },

      // for testing
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
    ],
  },
};

export default nextConfig;
