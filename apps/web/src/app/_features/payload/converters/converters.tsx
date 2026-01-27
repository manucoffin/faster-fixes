import {
  DefaultNodeTypes,
  SerializedBlockNode,
} from "@payloadcms/richtext-lexical";
import {
  JSXConvertersFunction,
  LinkJSXConverter,
} from "@payloadcms/richtext-lexical/react";
import { internalDocToHref } from "../_components/internal-doc-to-href";
import { relationshipConverter } from "../_components/relationship-converter";
import { buttonBlockConverter } from "./button-block-converter";
import { experimentalTableConverter } from "./experimental-table-converter";
import { faqSectionConverter } from "./faq-section-converter";
import { headingConverter } from "./heading-converter";
import { imageConverter } from "./image-converter";
import { textStateConverter } from "./text-state-converter";
import { youtubeBlockConverter } from "./youtube-block-converter";

type NodeTypes = DefaultNodeTypes | SerializedBlockNode;

export const jsxConverter: JSXConvertersFunction<NodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  ...headingConverter,
  ...imageConverter,
  ...relationshipConverter,
  ...textStateConverter,
  ...experimentalTableConverter,

  blocks: {
    ...buttonBlockConverter,
    ...youtubeBlockConverter,
    ...faqSectionConverter,
  },
});

export const jsxConverterClient: JSXConvertersFunction<NodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  ...headingConverter,
  ...imageConverter,
  ...relationshipConverter,
  ...textStateConverter,
  ...experimentalTableConverter,

  blocks: {
    ...buttonBlockConverter,
    ...youtubeBlockConverter,
    ...faqSectionConverter,
  },
});
