import { SerializedHeadingNode } from "@payloadcms/richtext-lexical";
import { JSXConverters } from "@payloadcms/richtext-lexical/react";
import slugify from "slugify";

const extractTextContent = (nodes: any[]): string => {
  return nodes
    .map((node) => {
      if (typeof node.text === "string") {
        return node.text;
      }
      if (Array.isArray(node.children)) {
        return extractTextContent(node.children);
      }
      return "";
    })
    .join("");
};

export const headingConverter: JSXConverters<SerializedHeadingNode> = {
  heading: ({ node, nodesToJSX }) => {
    const text = nodesToJSX({ nodes: node.children });
    const textContent = extractTextContent(node.children);
    const id = slugify(textContent, { lower: true, strict: true });
    const Tag = node.tag;

    return <Tag id={id}>{text}</Tag>;
  },
};
