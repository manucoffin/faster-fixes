import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    group: {
      en: "Blog",
      fr: "Blog",
    },
  },
  labels: {
    singular: {
      en: "Category",
      fr: "Catégorie",
    },
    plural: {
      en: "Categories",
      fr: "Catégories",
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      index: true,
      label: {
        en: "Name",
        fr: "Nom",
      },
    },
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
          en: "URL-friendly version of the name (e.g., 'conseils', 'news')",
          fr: "Version URL-friendly du nom (ex: 'conseils', 'news')",
        },
      },
    },
    {
      name: "description",
      type: "textarea",
      label: {
        en: "Description",
        fr: "Description",
      },
      admin: {
        description: {
          en: "Brief description of the category",
          fr: "Brève description de la catégorie",
        },
      },
    },
    {
      name: "color",
      type: "text",
      label: {
        en: "Color",
        fr: "Couleur",
      },
      admin: {
        description: {
          en: "Hex color for category display (e.g., #3B82F6)",
          fr: "Couleur hexadécimale pour l'affichage (ex: #3B82F6)",
        },
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: {
        en: "Image",
        fr: "Image",
      },
      admin: {
        description: {
          en: "Category image for display",
          fr: "Image de la catégorie pour l'affichage",
        },
      },
    },
  ],
  access: {
    read: () => true,
  },
};