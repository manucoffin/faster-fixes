import NextImage, { type StaticImageData } from "next/image";
import type { ComponentPropsWithoutRef } from "react";

type ImgProps = Omit<ComponentPropsWithoutRef<"img">, "src"> & {
  src?: string | StaticImageData;
};

export function MdxImage({ src, alt, width, height, ...props }: ImgProps) {
  if (!src) return null;

  const isStatic = typeof src === "object";

  return (
    <NextImage
      src={src}
      alt={alt ?? ""}
      {...(!isStatic && {
        width: Number(width) || 800,
        height: Number(height) || 450,
      })}
      className={props.className}
      sizes="(max-width: 672px) 100vw, 672px"
    />
  );
}
