import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { Field } from "payload";
import { getArrayRowLabel } from "./utils/get-array-row-label";

export const faqsField: Field = {
  name: "faqs",
  type: "array",
  required: true,
  minRows: 1,
  label: {
    en: "Questions & Answers",
    fr: "Questions et réponses",
  },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
      label: {
        en: "Question",
        fr: "Question",
      },
      admin: {
        placeholder: {
          en: "Enter the frequently asked question",
          fr: "Saisissez la question fréquemment posée",
        },
      },
    },
    {
      name: "answer",
      type: "richText",
      required: true,
      label: {
        en: "Answer",
        fr: "Réponse",
      },
      editor: lexicalEditor(),
      admin: {
        description: {
          en: "Provide a detailed answer to the question",
          fr: "Fournissez une réponse détaillée à la question",
        },
      },
    },
  ],
  admin: {
    description: {
      en: "Add questions and answers for this FAQ section",
      fr: "Ajoutez des questions et réponses pour cette section FAQ",
    },
    components: {
      RowLabel: getArrayRowLabel({
        fieldName: "question",
        itemPlaceholder: "Question",
      }),
    },
  },
};
