import type { ComponentPropsWithoutRef } from "react";
import slugify from "slugify";

export function createHeading(level: 2 | 3 | 4) {
  const Tag = `h${level}` as const;

  function Heading(props: ComponentPropsWithoutRef<typeof Tag>) {
    const text =
      typeof props.children === "string"
        ? props.children
        : String(props.children);
    const id = slugify(text, { lower: true, strict: true });
    return <Tag {...props} id={id} />;
  }

  Heading.displayName = `Heading${level}`;
  return Heading;
}
