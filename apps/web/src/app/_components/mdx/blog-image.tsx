import NextImage, { type StaticImageData } from "next/image";

type BlogImageProps = {
  src: StaticImageData;
  alt: string;
  className?: string;
};

export function BlogImage({ src, alt, className }: BlogImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      className={`rounded-lg ${className ?? ""}`}
      sizes="(max-width: 672px) 100vw, 672px"
    />
  );
}
