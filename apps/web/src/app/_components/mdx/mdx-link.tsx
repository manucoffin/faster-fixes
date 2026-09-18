import type { ComponentPropsWithoutRef } from "react";

export function MdxLink({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  if (typeof href !== "string" || href === "" || href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  const isExternal = /^https?:\/\//i.test(href);

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
