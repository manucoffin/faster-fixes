import { createMDX } from "fumadocs-mdx/next";
import process from "node:process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  typedRoutes: true,
  env: {
    // Without a public bucket or CDN URL, avatars and logos are read through
    // the app's storage route, which works for every provider.
    NEXT_PUBLIC_STORAGE_BASE_URL:
      process.env.NEXT_PUBLIC_STORAGE_BASE_URL ||
      `/api/storage/${
        process.env.STORAGE_BUCKET_NAME ||
        process.env.AWS_BUCKET_NAME ||
        "uploads"
      }`,
  },

  experimental: {
    agentUpgrade: "latest",
    authInterrupts: true,
  },

  async redirects() {
    return [
      {
        source: "/docs/widget/other-frameworks",
        destination: "/docs/widget/install/other-frameworks",
        permanent: true,
      },
      {
        source: "/docs/widget/react",
        destination: "/docs/widget/install/react",
        permanent: true,
      },
      {
        source: "/docs/widget/script-embed",
        destination: "/docs/widget/install/script-embed",
        permanent: true,
      },
      {
        source: "/docs/widget/use-feedback-hook",
        destination: "/docs/widget/control-the-widget",
        permanent: true,
      },
    ];
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
        ],
      },
      {
        // A header set here replaces the route's own, and the player document
        // sends no referrer (ADR-0023).
        source: "/:path((?!recording-player$).*)",
        headers: [
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

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

const withMDX = createMDX();

export default withMDX(nextConfig);
