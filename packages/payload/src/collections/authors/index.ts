import type { CollectionConfig } from "payload";

export const Authors: CollectionConfig = {
  slug: "authors",
  admin: {
    useAsTitle: "name",
    group: {
      en: "Blog",
      fr: "Blog",
    },
  },
  labels: {
    singular: {
      en: "Author",
      fr: "Auteur",
    },
    plural: {
      en: "Authors",
      fr: "Auteurs",
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
      admin: {
        description: "URL-friendly version of the name",
      },
    },
    {
      name: "email",
      type: "email",
      label: {
        en: "Email",
        fr: "Email",
      },
      admin: {
        description: {
          en: "Author's email address",
          fr: "Adresse email de l'auteur",
        },
      },
    },
    {
      name: "bio",
      type: "textarea",
      label: {
        en: "Biography",
        fr: "Biographie",
      },
      admin: {
        description: {
          en: "Author biography",
          fr: "Biographie de l'auteur",
        },
      },
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      label: {
        en: "Avatar",
        fr: "Photo de profil",
      },
      admin: {
        description: {
          en: "Author profile picture",
          fr: "Photo de profil de l'auteur",
        },
      },
    },
    {
      name: "socialLinks",
      type: "group",
      fields: [
        {
          name: "twitter",
          type: "text",
          admin: {
            placeholder: "https://twitter.com/username",
          },
        },
        {
          name: "linkedin",
          type: "text",
          admin: {
            placeholder: "https://linkedin.com/in/username",
          },
        },
        {
          name: "website",
          type: "text",
          admin: {
            placeholder: "https://example.com",
          },
        },
      ],
    },
  ],
  access: {
    read: () => true,
  },
};