"use client";

import { UploadButton } from "@/app/_components/upload-button.client";
import type { SubmitTestimonialInput } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TestimonialPhoto = SubmitTestimonialInput["photo"];

type TestimonialPhotoFieldProps = {
  token: string;
  value: TestimonialPhoto;
  onChange: (photo: TestimonialPhoto) => void;
  /** The account avatar, a bucket key or a provider URL. */
  avatar: string | null;
  name: string;
  disabled?: boolean;
};

export function TestimonialPhotoField({
  token,
  value,
  onChange,
  avatar,
  name,
  disabled = false,
}: TestimonialPhotoFieldProps) {
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    };
  }, [uploadPreviewUrl]);

  const previewUrl = {
    avatar: avatar ? resolveS3Url(avatar) : null,
    upload: uploadPreviewUrl,
    none: null,
  }[value.source];

  const description = {
    avatar: "Your account photo.",
    upload: "The photo you uploaded.",
    none: "No photo will be shown.",
  }[value.source];

  return (
    <div className="space-y-2">
      <Label>Photo (optional)</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar className="size-12">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="" className="object-cover" />
          ) : null}
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <UploadButton
          route="testimonial-photo"
          accept="image/png,image/jpeg,image/webp"
          label={previewUrl ? "Replace photo" : "Upload photo"}
          description="PNG, JPEG or WebP. 2 MB max."
          metadata={{ token }}
          disabled={disabled}
          onUploadComplete={({ key, raw }) => {
            setUploadPreviewUrl(URL.createObjectURL(raw));
            onChange({ source: "upload", key });
          }}
          onError={(error) => {
            toast.error(error.message || "Your photo could not be uploaded.");
          }}
        />
        {previewUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ source: "none" })}
          >
            Remove photo
          </Button>
        ) : null}
        {avatar && value.source !== "avatar" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ source: "avatar" })}
          >
            Use account photo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
