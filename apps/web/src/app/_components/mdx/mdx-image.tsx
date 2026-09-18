import { cn } from "@workspace/ui/lib/utils";
import type { StaticImageData } from "next/image";
import Image from "next/image";

type MdxImageProps = {
  src: string | StaticImageData;
  alt?: string;
  /** Aspect ratio of the image container */
  aspectRatio?: "video" | "square" | "portrait" | "auto";
  rounded?: boolean;
  className?: string;
};

export function MdxImage({
  src,
  alt = "",
  aspectRatio = "video",
  rounded = true,
  className,
}: MdxImageProps) {
  const isStaticImage = typeof src !== "string";

  return (
    <div
      className={cn(
        "not-prose relative w-full overflow-hidden",
        rounded && "rounded-lg",
        aspectRatio === "video" && "aspect-video",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "portrait" && "aspect-[3/4]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 600px"
        {...(isStaticImage && { placeholder: "blur" })}
      />
    </div>
  );
}
