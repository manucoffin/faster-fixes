"use client";

import { DeleteVideoDialog } from "@/app/_domains/video/video-actions/delete-video-dialog.client";
import { useVideoActions } from "@/app/_domains/video/video-actions/use-video-actions";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Copy, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ListVideosOutput } from "../../_services/list-videos";
import { RenameVideoDialog } from "./rename-video-dialog.client";
import { ReplaceVideoLinkDialog } from "./replace-video-link-dialog.client";

type VideoRowMenuProps = {
  video: ListVideosOutput[number];
  projectId: string;
};

type OpenDialog = "rename" | "replaceLink" | "delete" | null;

export function VideoRowMenu({ video, projectId }: VideoRowMenuProps) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const { renameMutation, replaceShareLinkMutation, deleteMutation } =
    useVideoActions({ videoId: video.id, projectId });

  // An abandoned upload offers Delete only, so it does not linger.
  const isUploading = video.state === "uploading";
  const { shareUrl } = video;

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link to the clipboard");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setOpenDialog(null);
  };

  return (
    // The row navigates on click; nothing inside the menu or its dialogs should.
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Video actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isUploading && (
            <>
              {shareUrl && (
                <DropdownMenuItem
                  onSelect={() => void handleCopyLink(shareUrl)}
                >
                  <Copy className="size-4" />
                  Copy link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setOpenDialog("rename")}>
                <Pencil className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenDialog("replaceLink")}>
                <Link2 className="size-4" />
                Rotate link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setOpenDialog("delete")}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameVideoDialog
        open={openDialog === "rename"}
        onOpenChange={handleOpenChange}
        title={video.title}
        isSaving={renameMutation.isPending}
        onRename={(title) =>
          renameMutation.mutateAsync({ videoId: video.id, title })
        }
      />
      <ReplaceVideoLinkDialog
        open={openDialog === "replaceLink"}
        onOpenChange={handleOpenChange}
        isReplacing={replaceShareLinkMutation.isPending}
        onReplaceLink={() =>
          replaceShareLinkMutation.mutateAsync({ videoId: video.id })
        }
      />
      <DeleteVideoDialog
        open={openDialog === "delete"}
        onOpenChange={handleOpenChange}
        feedbackCount={video.feedbackCount}
        isDeleting={deleteMutation.isPending}
        onDelete={() => deleteMutation.mutateAsync({ videoId: video.id })}
      />
    </div>
  );
}
