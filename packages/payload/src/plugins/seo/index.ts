import { seoPlugin as seo } from "@payloadcms/plugin-seo";

export const seoPlugin = seo({
  tabbedUI: true,
  collections: ["posts"],
  uploadsCollection: "media",
  generateTitle: ({ doc }) => `${doc.title}`,
  generateDescription: ({ doc, collectionSlug }) => {
    return doc.excerpt || doc.description || "";
  },
  generateImage: ({ doc }) => doc.featuredImage,
});
