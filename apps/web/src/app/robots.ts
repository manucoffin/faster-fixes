import { APP_URL } from "@/app/_constants/app";
import type { MetadataRoute } from "next";

// AI training crawlers that scrape content for model training, not search
const AI_TRAINING_CRAWLERS = [
  "CCBot",
  "GPTBot",
  "Google-Extended",
  "Bytespider",
  "ClaudeBot",
  "anthropic-ai",
  "Applebot-Extended",
  "Cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "Timpibot",
  "img2dataset",
];

const PRIVATE_ROUTES = [
  "/api/",
  "/admin/",
  "/account/",
  "/organization/",
  "/integrations",
  "/onboarding",
  "/inbox",
  "/reviewers",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block AI training crawlers entirely
      ...AI_TRAINING_CRAWLERS.map((bot) => ({
        userAgent: bot,
        disallow: ["/"],
      })),
      // Allow search engines and AI search bots (PerplexityBot, ChatGPT-User, etc.)
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROUTES,
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
