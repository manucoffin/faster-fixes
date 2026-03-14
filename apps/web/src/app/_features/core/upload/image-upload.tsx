"use client";

import { resolveS3Url } from "@/lib/upload/resolve-s3-url";
import { useUploadFile } from "@better-upload/client";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Camera, Loader2, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const shapeVariants = cva("overflow-hidden", {
  variants: {
    shape: {
      circle: "rounded-full",
      square: "rounded-lg",
      rounded: "rounded-xl",
    },
  },
  defaultVariants: {
    shape: "circle",
  },
});

type ImageUploadProps = {
  /** Current S3 key or full URL. S3 keys are resolved to URLs automatically. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** better-upload route name */
  route: string;
  accept?: string;
  /** Display shape of the image */
  shape?: VariantProps<typeof shapeVariants>["shape"];
  /** Fallback content in the empty state (default: Camera icon) */
  fallback?: ReactNode;
  disabled?: boolean;
  /**
   * Classes applied to the image area.
   * Use to control sizing (e.g. "size-16", "w-full h-32").
   * Defaults to "size-24" when omitted.
   */
  className?: string;
  onError?: (error: { type: string; message: string }) => void;
  /** When provided, the file is NOT uploaded immediately. The callback receives the raw File. */
  uploadOverride?: (file: File) => void;
  /** External pending state, used when uploadOverride is provided. */
  isExternalPending?: boolean;
  /**
   * Called when the user clicks the remove button.
   * When provided, `onChange(null)` is NOT called automatically —
   * the parent handles deletion (S3, DB) and clears the value.
   * When omitted, `onChange(null)` is called directly.
   */
  onRemove?: () => void;
  /** Optional element rendered alongside the delete button on hover (e.g. metadata edit dialog trigger). */
  editAction?: ReactNode;
  /** Called after a successful upload with file metadata. */
  onUploadComplete?: (metadata: {
    key: string;
    size: number;
    mimeType: string;
  }) => void;
};

export function ImageUpload({
  value,
  onChange,
  route,
  accept = "image/*",
  shape = "circle",
  fallback,
  disabled = false,
  className,
  onError,
  uploadOverride,
  isExternalPending = false,
  onRemove,
  editAction,
  onUploadComplete: onUploadCompleteProp,
}: ImageUploadProps) {
  const id = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const { control } = useUploadFile({
    route,
    onUploadComplete: ({ file }) => {
      const blobUrl = URL.createObjectURL(file.raw);
      previewUrlRef.current = blobUrl;
      setPreviewUrl(blobUrl);
      onChange(file.objectInfo.key);
      onUploadCompleteProp?.({
        key: file.objectInfo.key,
        size: file.raw.size,
        mimeType: file.raw.type,
      });
    },
    onError: onError ? (error) => onError(error) : undefined,
  });

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
      return;
    }
    revokePreview();
    setPreviewUrl(null);
    onChange(null);
  }, [onChange, onRemove, revokePreview]);

  const displayUrl = previewUrl ?? (value ? resolveS3Url(value) : null);
  const hasImage = !!displayUrl;
  const isUploading = isExternalPending || control.isPending;
  const isDisabled = disabled || isUploading;

  return (
    <div
      className={cn(
        "group/image-upload relative",
        !className && "inline-block size-24",
        className,
      )}
    >
      {/* Hidden file input */}
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={isDisabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.[0] && !isUploading) {
            const file = e.target.files[0];
            if (uploadOverride) {
              const blobUrl = URL.createObjectURL(file);
              revokePreview();
              previewUrlRef.current = blobUrl;
              setPreviewUrl(blobUrl);
              uploadOverride(file);
            } else {
              control.upload(file);
            }
          }
          e.target.value = "";
        }}
      />

      {/* Clickable image area */}
      <label
        htmlFor={id}
        className={cn(
          "relative flex size-full items-center justify-center transition",
          shapeVariants({ shape }),
          !isDisabled && "cursor-pointer",
          isDisabled && "cursor-not-allowed opacity-50",
          !hasImage && "bg-muted border-2 border-dashed transition-colors",
          !hasImage && !isDisabled && "hover:border-primary/50",
        )}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-muted-foreground">
            {isUploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              (fallback ?? <Camera className="size-6" />)
            )}
          </span>
        )}

        {/* Spinner overlay when replacing an existing image */}
        {hasImage && isUploading && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
      </label>

      {/* Action buttons — positioned outside overflow-hidden so they aren't clipped */}
      {hasImage && !isDisabled && (
        <div className="absolute -top-1 -right-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover/image-upload:opacity-100 focus-within:opacity-100">
          {editAction}
          <Button
            className="size-7 rounded-full"
            variant="destructive"
            size="icon-xs"
            onClick={handleRemove}
            aria-label="Supprimer"
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
