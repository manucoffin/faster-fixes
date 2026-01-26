import type { CollectionConfig } from "payload";
import slugify from "slugify";

// Utility function to calculate reading time from rich text content
const calculateReadingTime = (content: any): number => {
  if (!content) return 0;

  // Extract text content from Lexical rich text format
  const extractTextFromLexical = (node: any): string => {
    if (!node || typeof node !== "object") return "";

    if (node.type === "text") {
      return node.text || "";
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractTextFromLexical).join(" ");
    }

    return "";
  };

  let text = "";
  if (content.root && content.root.children) {
    text = content.root.children.map(extractTextFromLexical).join(" ");
  }

  // Clean up the text
  text = text.replace(/\s+/g, " ").trim();

  // Calculate reading time (average 200 words per minute)
  const wordCount = text.split(" ").filter((word) => word.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return readingTime;
};

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    group: {
      en: "Blog",
      fr: "Blog",
    },
    defaultColumns: ["title", "category", "status", "publishedAt"],
  },
  labels: {
    singular: {
      en: "Post",
      fr: "Article",
    },
    plural: {
      en: "Posts",
      fr: "Articles",
    },
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: {
            en: "Content",
            fr: "Contenu",
          },
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              index: true,
              label: {
                en: "Title",
                fr: "Titre",
              },
            },

            {
              name: "excerpt",
              type: "textarea",
              label: {
                en: "Excerpt",
                fr: "Extrait",
              },
              admin: {
                description: {
                  en: "Brief summary of the post (optional)",
                  fr: "Résumé bref de l'article (optionnel)",
                },
              },
            },
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
              label: {
                en: "Featured Image",
                fr: "Image à la une",
              },
              admin: {
                description: {
                  en: "Main image for the post",
                  fr: "Image principale de l'article",
                },
              },
            },
            {
              name: "content",
              type: "richText",
              required: true,
              label: {
                en: "Content",
                fr: "Contenu",
              },
            },
          ],
        },
        {
          label: {
            en: "Metadata",
            fr: "Métadonnées",
          },
          fields: [
            {
              name: "slug",
              type: "text",
              required: true,
              unique: true,
              index: true,
              label: {
                en: "Slug",
                fr: "Identifiant URL",
              },
              admin: {
                description: {
                  en: "URL-friendly version of the title (auto-generated)",
                  fr: "Version URL-friendly du titre (générée automatiquement)",
                },
                // readOnly: true,
              },
            },
            {
              name: "category",
              type: "relationship",
              relationTo: "categories",
              required: true,
              index: true,
              label: {
                en: "Category",
                fr: "Catégorie",
              },
            },
            {
              name: "tags",
              type: "relationship",
              relationTo: "tags",
              hasMany: true,
              label: {
                en: "Tags",
                fr: "Étiquettes",
              },
            },
            {
              name: "author",
              type: "relationship",
              relationTo: "authors",
              required: true,
              index: true,
              label: {
                en: "Author",
                fr: "Auteur",
              },
            },
            {
              name: "status",
              type: "select",
              required: true,
              defaultValue: "draft",
              label: {
                en: "Status",
                fr: "Statut",
              },
              options: [
                {
                  label: {
                    en: "Draft",
                    fr: "Brouillon",
                  },
                  value: "draft",
                },
                {
                  label: {
                    en: "Published",
                    fr: "Publié",
                  },
                  value: "published",
                },
              ],
              index: true,
            },
            {
              name: "publishedAt",
              type: "date",
              label: {
                en: "Published At",
                fr: "Publié le",
              },
              admin: {
                description: {
                  en: "When this post was/will be published",
                  fr: "Quand cet article a été/sera publié",
                },
                date: {
                  pickerAppearance: "dayAndTime",
                },
              },
              index: true,
            },
            {
              name: "readingTime",
              type: "number",
              label: {
                en: "Reading Time (min)",
                fr: "Temps de lecture (min)",
              },
              admin: {
                description: {
                  en: "Estimated reading time in minutes (auto-calculated)",
                  fr: "Temps de lecture estimé en minutes (calculé automatiquement)",
                },
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
  access: {
    read: () => true, // Allow admin access to all posts
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-generate slug from title
        if (data.title && (!data.slug || data.slug === "")) {
          data.slug = slugify(data.title, { lower: true, strict: true });
        }

        // Auto-calculate reading time from content
        if (data.content) {
          data.readingTime = calculateReadingTime(data.content);
        }

        // Auto-set publish date when publishing
        if (data.status === "published" && !data.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }

        return data;
      },
    ],
  },
};
