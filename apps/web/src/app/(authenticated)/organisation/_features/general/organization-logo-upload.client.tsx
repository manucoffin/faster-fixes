"use client";

import { UploadButton } from "@/app/_features/core/upload/upload-button";
import { organization, useActiveOrganization } from "@/lib/auth";
import { trpc } from "@/lib/trpc/trpc-client";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import { getInitials } from "@/utils/text/get-initials";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function OrganizationLogoUpload() {
  const { data: activeOrg } = useActiveOrganization();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const deleteOldLogo =
    trpc.authenticated.organisation.updateLogo.useMutation();

  const orgName = activeOrg?.name ?? "Organisation";
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
        label="Changer le logo"
        description="PNG, JPEG ou WebP. 2 Mo maximum."
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

            toast.success("Logo mis à jour avec succès");
          } catch {
            toast.error("Erreur lors de la mise à jour du logo.");
          }
        }}
        onError={(error) => {
          toast.error(error.message || "Erreur lors de l'upload du logo.");
        }}
      />
    </div>
  );
}
