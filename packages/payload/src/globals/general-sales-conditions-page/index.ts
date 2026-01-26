import type { GlobalConfig } from "payload";

export const GeneralSalesConditionsPage: GlobalConfig = {
  slug: "general-sales-conditions-page",
  label: {
    en: "General Sales Conditions",
    fr: "Conditions Générales de Ventes",
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
