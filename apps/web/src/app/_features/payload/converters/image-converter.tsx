import { SerializedUploadNode } from "@payloadcms/richtext-lexical";
import { JSXConverters } from "@payloadcms/richtext-lexical/react";
import Image from "next/image";

type PopulatedImage = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  mimeType?: string;
};

function getImageDimensions(image: PopulatedImage): {
  width: number;
  height: number;
} {
  // Payload CMS provides width and height
  if (image.width && image.height) {
    return { width: image.width, height: image.height };
  }

  // Fallback dimensions if not provided
  return { width: 800, height: 600 };
}

function getAltText(image: PopulatedImage): string {
  return image.alt || "Image from content";
}

export const imageConverter: JSXConverters<SerializedUploadNode> = {
  upload: ({ node }) => {
    const { value } = node;

    if (!value || typeof value !== "object") {
      return (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-600">Missing image</p>
        </div>
      );
    }

    const image = value as unknown as PopulatedImage;
    const { width, height } = getImageDimensions(image);
    const alt = getAltText(image);

    return (
      <div className="my-6 flex w-full justify-center">
        <div className="w-full max-w-2xl">
          <Image
            src={image.url}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            priority={false}
          />
          {image.alt && (
            <p className="text-muted-foreground mt-2 text-center text-sm italic">
              {image.alt}
            </p>
          )}
        </div>
      </div>
    );
  },
};
