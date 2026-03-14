"use client";

import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import { useUploadFile } from "@better-upload/client";
import { formatBytes } from "@better-upload/client/helpers";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { File, Loader2, Trash2, Upload } from "lucide-react";
import { type ReactNode, useCallback, useId, useState } from "react";
import { useDropzone } from "react-dropzone";

type UploadedFileInfo = {
  key: string;
  name: string;
  size: number;
  type: string;
};

type FileUploadProps = {
  value: UploadedFileInfo | null;
  onChange: (value: UploadedFileInfo | null) => void;
  /** better-upload route name */
  route: string;
  accept?: string;
  /** Constraints displayed in the dropzone */
  description?: string | { fileTypes?: string; maxFileSize?: string };
  disabled?: boolean;
  className?: string;
  onError?: (error: { type: string; message: string }) => void;
  /** When provided, the file is NOT uploaded immediately. The callback receives the raw File. */
  uploadOverride?: (file: globalThis.File) => void;
  /** External pending state, used when uploadOverride is provided. */
  isExternalPending?: boolean;
  /**
   * Called when the user clicks the remove button.
   * When provided, `onChange(null)` is NOT called automatically —
   * the parent handles deletion (S3, DB) and clears the value.
   * When omitted, `onChange(null)` is called directly.
   */
  onRemove?: () => void;
  /** Optional element rendered in the file card actions (e.g. metadata edit dialog trigger). */
  editAction?: ReactNode;
};

export type { UploadedFileInfo };

export function FileUpload({
  value,
  onChange,
  route,
  accept,
  description,
  disabled = false,
  className,
  onError,
  uploadOverride,
  isExternalPending = false,
  onRemove,
  editAction,
}: FileUploadProps) {
  const id = useId();

  // Local file info for immediate display after upload / uploadOverride
  const [localFileInfo, setLocalFileInfo] = useState<UploadedFileInfo | null>(
    null,
  );

  const { control } = useUploadFile({
    route,
    onUploadComplete: ({ file }) => {
      const info: UploadedFileInfo = {
        key: file.objectInfo.key,
        name: file.raw.name,
        size: file.raw.size,
        type: file.raw.type,
      };
      setLocalFileInfo(info);
      onChange(info);
    },
    onError: onError ? (error) => onError(error) : undefined,
  });

  const isUploading = isExternalPending || control.isPending;
  const isDisabled = disabled || isUploading;
  const displayValue = value ?? localFileInfo;

  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0 && !isUploading) {
        const file = files[0];
        if (!file) return;

        if (uploadOverride) {
          setLocalFileInfo({
            key: "",
            name: file.name,
            size: file.size,
            type: file.type,
          });
          uploadOverride(file);
        } else {
          control.upload(file);
        }
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    noClick: true,
    disabled: isDisabled || !!displayValue,
  });

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
      return;
    }
    setLocalFileInfo(null);
    onChange(null);
  }, [onChange, onRemove]);

  // ── File card (filled state) ──────────────────────────────────────────
  if (displayValue) {
    return (
      <div
        className={cn(
          "dark:bg-input/10 flex items-center gap-3 rounded-lg border bg-transparent p-3",
          className,
        )}
      >
        <FileTypeIcon type={displayValue.type} />

        <div className="min-w-0 flex-1">
          <a
            href={displayValue.key ? resolveS3Url(displayValue.key) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {displayValue.name}
          </a>
          <p className="text-muted-foreground text-xs">
            {formatBytes(displayValue.size)}
          </p>
        </div>

        {!isDisabled && (
          <div className="flex items-center gap-1">
            {editAction}
            <Button
              type="button"
              variant="destructive"
              size="icon-xs"
              onClick={handleRemove}
              aria-label="Supprimer le fichier"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Dropzone (empty state) ────────────────────────────────────────────
  return (
    <div
      className={cn(
        "relative rounded-lg border border-dashed transition-colors",
        isDragActive && "border-primary/80",
        className,
      )}
    >
      <label
        {...getRootProps()}
        className={cn(
          "dark:bg-input/10 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent px-4 py-6 transition-colors",
          isDisabled && "text-muted-foreground cursor-not-allowed",
          !isDisabled && "hover:bg-accent dark:hover:bg-accent/40",
          isDragActive && "opacity-0",
        )}
        htmlFor={id}
      >
        <div className="my-2">
          {isUploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1 text-center">
          <p className="text-sm font-semibold">
            {isUploading
              ? "Envoi en cours..."
              : "Glissez-déposez un fichier ici"}
          </p>

          {description && (
            <p className="text-muted-foreground max-w-64 text-xs">
              {typeof description === "string" ? (
                description
              ) : (
                <>
                  {description.maxFileSize &&
                    `Jusqu'à ${description.maxFileSize}. `}
                  {description.fileTypes &&
                    `Formats acceptés : ${description.fileTypes}.`}
                </>
              )}
            </p>
          )}
        </div>

        <input
          {...getInputProps()}
          type="file"
          id={id}
          accept={accept}
          disabled={isDisabled}
        />
      </label>

      {isDragActive && (
        <div className="pointer-events-none absolute inset-0 rounded-lg">
          <div className="bg-accent dark:bg-accent/40 flex size-full flex-col items-center justify-center rounded-lg">
            <div className="my-2">
              <Upload className="size-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">Déposez le fichier ici</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── File type icon with badge ─────────────────────────────────────────

const ICON_CAPTIONS: Record<string, string> = {
  "image/": "IMG",
  "video/": "VID",
  "audio/": "AUD",
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "text/csv": "CSV",
  "text/plain": "TXT",
};

function FileTypeIcon({ type }: { type: string }) {
  const caption = Object.entries(ICON_CAPTIONS).find(([key]) =>
    type.startsWith(key),
  )?.[1];

  return (
    <div className="relative shrink-0">
      <File className="text-muted-foreground size-10" strokeWidth={1} />
      {caption && (
        <span className="bg-primary text-primary-foreground absolute bottom-1.5 left-0.5 rounded px-1 py-px text-[10px] leading-tight font-semibold select-none">
          {caption}
        </span>
      )}
    </div>
  );
}
