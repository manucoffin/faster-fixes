import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    group: {
      en: "Blog",
      fr: "Blog",
    },
  },
  labels: {
    singular: {
      en: "Tag",
      fr: "Étiquette",
    },
    plural: {
      en: "Tags",
      fr: "Étiquettes",
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
          en: "URL-friendly version of the name",
          fr: "Version URL-friendly du nom",
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
          en: "Optional description of the tag",
          fr: "Description optionnelle de l'étiquette",
        },
      },
    },
  ],
  access: {
    read: () => true,
  },
};