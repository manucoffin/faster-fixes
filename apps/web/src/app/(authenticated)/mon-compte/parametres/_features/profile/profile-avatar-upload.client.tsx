"use client";

import { UploadButton } from "@/app/_features/core/upload/upload-button";
import { useSession } from "@/lib/auth";
import { trpc } from "@/lib/trpc/trpc-client";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Facehash } from "facehash";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function ProfileAvatarUpload() {
  const { data: session } = useSession();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const updateAvatarMutation =
    trpc.authenticated.account.profile.updateAvatar.useMutation();

  const userName = session?.user.name ?? "Utilisateur";
  const userEmail = session?.user.email ?? userName;
  const userImage = session?.user.image;

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const displayUrl =
    previewUrl ??
    (userImage
      ? userImage.startsWith("http")
        ? userImage
        : resolveS3Url(userImage)
      : null);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {displayUrl && (
          <AvatarImage
            src={displayUrl}
            alt={userName}
            className="object-cover"
          />
        )}
        <AvatarFallback>
          <Facehash name={userEmail} size={64} />
        </AvatarFallback>
      </Avatar>

      <UploadButton
        route="user-avatar"
        accept="image/png,image/jpeg,image/webp"
        label="Changer l'avatar"
        description="PNG, JPEG ou WebP. 2 Mo maximum."
        disabled={!session || updateAvatarMutation.isPending}
        onUploadComplete={async ({ key, raw }) => {
          if (!session) return;

          // Show immediate preview
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
          const blobUrl = URL.createObjectURL(raw);
          previewUrlRef.current = blobUrl;
          setPreviewUrl(blobUrl);

          try {
            await updateAvatarMutation.mutateAsync({ imageKey: key });
            toast.success("Avatar mis à jour avec succès");
          } catch {
            toast.error("Erreur lors de la mise à jour de l'avatar.");
          }
        }}
        onError={(error) => {
          toast.error(error.message || "Erreur lors de l'upload de l'avatar.");
        }}
      />
    </div>
  );
}
