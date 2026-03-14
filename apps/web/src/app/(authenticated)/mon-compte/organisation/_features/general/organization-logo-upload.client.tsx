"use client";

import { organization, useActiveOrganization } from "@/lib/auth";
import { getInitials } from "@/utils/text/get-initials";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export function OrganizationLogoUpload() {
  const { data: activeOrg } = useActiveOrganization();
  const [isPending, setIsPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const orgName = activeOrg?.name ?? "Organisation";
  const orgLogo = (activeOrg as Record<string, unknown>)?.logo as
    | string
    | undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrg) return;

    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", activeOrg.id);

      const response = await fetch("/api/organization/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de l'upload du logo.");
        return;
      }

      const { url } = await response.json();

      await organization.update({
        organizationId: activeOrg.id,
        data: { logo: url },
      });

      toast.success("Logo mis à jour avec succès");
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setIsPending(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-lg">
        {orgLogo && <AvatarImage src={orgLogo} alt={orgName} />}
        <AvatarFallback className="rounded-lg text-lg">
          {getInitials(orgName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isPending ? "Upload en cours..." : "Changer le logo"}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG ou WebP. 2 Mo maximum.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
