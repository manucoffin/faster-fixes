"use client";

import { UploadButton } from "@/app/_features/core/upload/upload-button";
import { organization, useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import { getInitials } from "@/utils/text/get-initials";
import { useMutation } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function OrganizationLogoUpload() {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const deleteOldLogo = useMutation(
    trpc.authenticated.organization.updateLogo.mutationOptions(),
  );

  const orgName = activeOrg?.name ?? "organization";
  const orgLogo = (activeOrg as Record<string, unknown>)?.logo as
    | string
    | undefined;

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const displayUrl = previewUrl ?? (orgLogo ? resolveS3Url(orgLogo) : null);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-lg">
        {displayUrl && (
          <AvatarImage
            src={displayUrl}
            alt={orgName}
            className="object-cover"
          />
        )}
        <AvatarFallback className="rounded-lg text-lg">
          {getInitials(orgName)}
        </AvatarFallback>
      </Avatar>

      <UploadButton
        route="organization-logo"
        accept="image/png,image/jpeg,image/webp"
        label="Change logo"
        description="PNG, JPEG or WebP. 2 MB max."
        disabled={!activeOrg || deleteOldLogo.isPending}
        metadata={activeOrg ? { organizationId: activeOrg.id } : undefined}
        onUploadComplete={async ({ key, raw }) => {
          if (!activeOrg) return;

          // Show immediate preview
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
          const blobUrl = URL.createObjectURL(raw);
          previewUrlRef.current = blobUrl;
          setPreviewUrl(blobUrl);

          try {
            // 1. Delete old logo object from R2
            await deleteOldLogo.mutateAsync({
              organizationId: activeOrg.id,
            });

            // 2. Store key via better-auth (updates DB + syncs cache)
            await organization.update({
              organizationId: activeOrg.id,
              data: { logo: key },
            });

            toast.success("Logo updated successfully");
          } catch {
            toast.error("Error updating logo.");
          }
        }}
        onError={(error) => {
          toast.error(error.message || "Error uploading logo.");
        }}
      />
    </div>
  );
}
