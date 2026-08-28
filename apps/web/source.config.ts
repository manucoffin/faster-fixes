import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "src/content/docs",
  docs: {
    // Doc titles are written for in-app navigation ("Introduction"), which makes
    // poor SERP snippets. metaTitle/metaDescription let a page override the
    // snippet without changing the sidebar label. noindex keeps retired pages
    // out of the sitemap and the index.
    schema: frontmatterSchema.extend({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      noindex: z.boolean().optional(),
    }),
  },
});

// YAML 1.2 parses unquoted ISO-like values (2026-05-24) as Date objects.
// We coerce to ISO string so the schema can stay z.string() and downstream
// code can treat date fields as strings regardless of how they were written.
const dateString = z.preprocess((value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}, z.string());

export const blog = defineDocs({
  dir: "src/content/blog",
  docs: {
    schema: frontmatterSchema.extend({
      date: dateString,
      updatedAt: dateString.optional(),
      keywords: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      excerpt: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      canonicalUrl: z.string().optional(),
    }),
  },
});

export default defineConfig({
  mdxOptions: {
    remarkNpmOptions: {
      persist: { id: "package-manager" },
    },
  },
});
