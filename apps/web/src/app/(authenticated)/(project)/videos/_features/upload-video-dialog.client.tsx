"use client";

import { formatBytes } from "@/app/_domains/video/_helpers/format-bytes";
import { formatVideoQuotaDenial } from "@/app/_domains/video/_helpers/format-video-usage";
import type { VideoQuotaDenial } from "@/server/auth/subscription/check-video-quota";
import { ActionButton } from "@workspace/ui/components/action-button";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Progress } from "@workspace/ui/components/progress";
import { AlertCircle, FileVideo, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import { useUploadVideo } from "./use-upload-video";

const ACCEPTED_FILES = ".mp4,.m4v,.mov,video/mp4,video/quicktime";
const EXPORT_H264_DOCS_HREF = "/docs/videos/export-h264";

type UploadVideoDialogProps = {
  projectId: string;
};

export function UploadVideoDialog({ projectId }: UploadVideoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      // Closing is decided inside, where the transfer state lives.
      onOpenChange={(next) => next && setOpen(true)}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload />
          Upload
        </Button>
      </DialogTrigger>
      {open && (
        <UploadVideoDialogContent
          projectId={projectId}
          onClose={() => setOpen(false)}
        />
      )}
    </Dialog>
  );
}

type UploadVideoDialogContentProps = {
  projectId: string;
  onClose: () => void;
};

function UploadVideoDialogContent({
  projectId,
  onClose,
}: UploadVideoDialogContentProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    form,
    picked,
    notice,
    denial,
    plan,
    isCloud,
    serverError,
    canUpload,
    isTransferring,
    progress,
    pickFile,
    upload,
    cancel,
  } = useUploadVideo({ projectId, onUploaded: onClose });

  const requestClose = () => {
    if (isTransferring) {
      if (!window.confirm("Cancel the upload? The video will not be saved.")) {
        return;
      }
      cancel();
    }
    onClose();
  };

  return (
    <DialogContent
      showCloseButton={false}
      onEscapeKeyDown={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onInteractOutside={(event) => {
        event.preventDefault();
        if (!isTransferring) {
          onClose();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>Upload video</DialogTitle>
        <DialogDescription>
          An MP4 or MOV file with H.264 video.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={upload} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={ACCEPTED_FILES}
              disabled={isTransferring}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void pickFile(file);
                }
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isTransferring}
              onClick={() => inputRef.current?.click()}
              className="justify-start"
            >
              <FileVideo />
              <span className="truncate">
                {picked
                  ? `${picked.file.name} (${formatBytes(picked.file.size)})`
                  : "Choose a file"}
              </span>
            </Button>

            {picked && !picked.classification && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Checking the file
              </p>
            )}
            {notice?.refusal && (
              <p className="text-sm text-destructive">
                {notice.refusal}{" "}
                <Link
                  href={EXPORT_H264_DOCS_HREF}
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  How to export H.264
                </Link>
              </p>
            )}
            {notice?.warnings.map((warning) => (
              <p key={warning} className="text-sm text-muted-foreground">
                {warning}
              </p>
            ))}
          </div>

          {denial && (
            <VideoQuotaDenialAlert
              denial={denial}
              plan={plan}
              isCloud={isCloud}
            />
          )}
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {picked && (
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input disabled={isTransferring} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isTransferring && <Progress value={Math.round(progress * 100)} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={requestClose}>
              Cancel
            </Button>
            <ActionButton
              type="submit"
              disabled={!canUpload}
              pending={isTransferring}
            >
              {isTransferring ? "Uploading..." : "Upload"}
            </ActionButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

type VideoQuotaDenialAlertProps = {
  denial: VideoQuotaDenial;
  plan: string | null;
  isCloud: boolean;
};

function VideoQuotaDenialAlert({
  denial,
  plan,
  isCloud,
}: VideoQuotaDenialAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>
        <p>
          {formatVideoQuotaDenial(denial, plan ?? "current")}
          {isCloud && (
            <>
              {" "}
              <Link
                href="/account/billing"
                className="underline underline-offset-4"
              >
                Billing
              </Link>
              . Delete videos to free space.
            </>
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
}
