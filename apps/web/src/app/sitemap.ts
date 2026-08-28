import { APP_URL } from "@/app/_constants/app";
import { blogSource } from "@/lib/blog/source";
import { source } from "@/lib/docs/source";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // The /docs index is listed explicitly below with a higher priority, and
  // noindex pages must not be advertised — both would otherwise be emitted here.
  const docPages = source
    .getPages()
    .filter((page) => page.url !== "/docs" && !page.data.noindex)
    .map((page) => ({
      url: `${APP_URL}${page.url}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const blogPages = blogSource.getPages().map((page) => ({
    url: `${APP_URL}${page.url}`,
    lastModified: page.data.updatedAt
      ? new Date(page.data.updatedAt)
      : new Date(page.data.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/open-source`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/bugherd`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/marker-io`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/usersnap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/userback`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/atarim`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/gleap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/ruttl`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/vs/markup-io`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/integrations/github`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/integrations/linear`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/integrations/jira`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/integrations/slack`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/integrations/mcp`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogPages,
    ...docPages,
    {
      url: `${APP_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/terms-of-sale`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
