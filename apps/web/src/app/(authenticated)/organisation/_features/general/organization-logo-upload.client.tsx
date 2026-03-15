"use client";

import { UploadButton } from "@/app/_features/core/upload/upload-button";
import { organization, useActiveOrganization } from "@/lib/auth";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import { getInitials } from "@/utils/text/get-initials";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { toast } from "sonner";

export function OrganizationLogoUpload() {
  const { data: activeOrg } = useActiveOrganization();

  const orgName = activeOrg?.name ?? "Organisation";
  const orgLogo = (activeOrg as Record<string, unknown>)?.logo as
    | string
    | undefined;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-lg">
        {orgLogo && (
          <AvatarImage src={resolveS3Url(orgLogo)} alt={orgName} />
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
        disabled={!activeOrg}
        metadata={
          activeOrg ? { organizationId: activeOrg.id } : undefined
        }
        onUploadComplete={async ({ key }) => {
          if (!activeOrg) return;

          try {
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
