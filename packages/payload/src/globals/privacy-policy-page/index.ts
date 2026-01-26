import type { GlobalConfig } from "payload";

export const PrivacyPolicyPage: GlobalConfig = {
  slug: "privacy-policy-page",
  label: {
    en: "Privacy Policy",
    fr: "Politique de Confidentialité",
  },
  admin: {
    group: {
      en: "Site Configuration",
      fr: "Configuration du site",
    },
  },
  fields: [
    {
      name: "pageTitle",
      type: "text",
      required: true,
      label: {
        en: "Page Title",
        fr: "Titre de la page",
      },
      admin: {
        placeholder: {
          en: "Enter the page title",
          fr: "Saisissez le titre de la page",
        },
      },
    },
    {
      name: "pageContent",
      type: "richText",
      required: true,
      label: {
        en: "Page Content",
        fr: "Contenu de la page",
      },
    },
  ],
  access: {
    read: () => true,
  },
};
