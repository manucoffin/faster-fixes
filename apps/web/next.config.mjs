import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages: ["@workspace/ui"],
  typedRoutes: true,

  experimental: {
    authInterrupts: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // // Exclude server-only packages from bundling to prevent Turbopack errors
  serverExternalPackages: [
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
        hostname: "readyjs-dev.s3.eu-west-3.amazonaws.com",
      },

      // R2 bucket
      {
        protocol: "https",
        hostname: "pub-c5726c6e6e084e2eb959739e0af1646a.r2.dev",
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

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
