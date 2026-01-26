import { postgresAdapter } from "@payloadcms/db-postgres";
import {
  BlocksFeature,
  defaultColors,
  EXPERIMENTAL_TableFeature,
  lexicalEditor,
  LinkFeature,
  RelationshipFeature,
  TextStateFeature,
} from "@payloadcms/richtext-lexical";
import { FAQBlock } from "@workspace/payload/blocks/rich-text/faq-block";
import { YouTubeBlock } from "@workspace/payload/blocks/rich-text/youtube-block";
import { Authors } from "@workspace/payload/collections/authors";
import { Categories } from "@workspace/payload/collections/categories";
import { Media } from "@workspace/payload/collections/media";
import { Posts } from "@workspace/payload/collections/posts";
import { Tags } from "@workspace/payload/collections/tags";
import { GeneralSalesConditionsPage } from "@workspace/payload/globals/general-sales-conditions-page";
import { PrivacyPolicyPage } from "@workspace/payload/globals/privacy-policy-page";
import { TermsAndConditionsPage } from "@workspace/payload/globals/terms-and-conditions-page";
import { s3StoragePlugin } from "@workspace/payload/plugins/s3-storage";
import { seoPlugin } from "@workspace/payload/plugins/seo";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "payload";
import { buildConfig, deepMerge } from "payload";
import { en } from "payload/i18n/en";
import { fr } from "payload/i18n/fr";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Full example: https://github.com/fusionary/turbo-payload/blob/main/packages/payload/src/configurePayload.ts

const baseConfig: Config = {
  blocks: [],

  // If you'd like to use Rich Text, pass your editor here
  editor: lexicalEditor({
    features: ({ defaultFeatures, rootFeatures }) => [
      ...defaultFeatures,
      LinkFeature(),
      RelationshipFeature({
        disabledCollections: ["users"], // Collections to exclude
        maxDepth: 2, // Population depth for relationships
      }),
      BlocksFeature({
        blocks: [YouTubeBlock, FAQBlock],
      }),
      EXPERIMENTAL_TableFeature(),
      TextStateFeature({
        state: {
          color: {
            ...defaultColors.text,
            ...defaultColors.background,
          },
        },
      }),
    ],
  }),

  // Define and configure your collections in this array
  collections: [Posts, Categories, Tags, Authors, Media],

  // Define and configure your globals in this array
  globals: [
    PrivacyPolicyPage,
    TermsAndConditionsPage,
    GeneralSalesConditionsPage,
  ],

  plugins: [s3StoragePlugin, seoPlugin],

  upload: {
    limits: {
      fileSize: 5000000,
    },
  },

  i18n: {
    supportedLanguages: { fr, en },
  },

  // Your Payload secret - should be a complex and secure string, unguessable
  secret: process.env.PAYLOAD_PRIVATE_SECRET || "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_PRIVATE_DATABASE_URI || "",
    },
  }),

  routes: {
    admin: "/",
  },

  admin: {
    importMap: {
      baseDir: path.resolve(dirname, "src"),
      importMapFile: path.resolve(dirname, "app", "importMap.js"),
    },
  },

  typescript: {
    outputFile: path.resolve(dirname, "./payload.types.ts"),
  },
};

export const configurePayload = (overrides?: Partial<Config>) => {
  return buildConfig(deepMerge(baseConfig, overrides ?? {}));
};
