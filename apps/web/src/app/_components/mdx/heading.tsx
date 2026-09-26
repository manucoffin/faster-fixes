import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { isValidElement } from "react";
import slugify from "slugify";

export function createHeading(level: 2 | 3 | 4) {
  const Tag = `h${level}` as const;

  function Heading(props: ComponentPropsWithoutRef<typeof Tag>) {
    const id = slugify(textOf(props.children), { lower: true, strict: true });
    return <Tag {...props} id={id} />;
  }

  Heading.displayName = `Heading${level}`;
  return Heading;
}

// The heading's visible text, so a heading holding inline code or a link still
// gets a readable anchor rather than `[object Object]`.
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}
