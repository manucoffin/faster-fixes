"use client";

import { formatBytes } from "@/app/_domains/video/_helpers/format-bytes";
import { formatTimecode } from "@/app/_domains/video/_helpers/format-timecode";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Check, Copy, SquarePlay } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import type { ListVideosOutput } from "../_services/list-videos";

type VideosTableProps = {
  videos: ListVideosOutput;
};

type Video = ListVideosOutput[number];

export function VideosTable({ videos }: VideosTableProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = async (shareUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      toast.error("Could not copy the link to the clipboard");
      return;
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24" />
          <TableHead>Title</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Open feedback</TableHead>
          <TableHead>Annotations</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => {
          const href = `/videos/${video.id}` as const;
          const isUploading = video.state === "uploading";

          return (
            <TableRow
              key={video.id}
              className="cursor-pointer"
              onClick={() => router.push(href)}
            >
              <TableCell>
                <VideoPoster posterUrl={video.posterUrl} />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={href} onClick={(event) => event.stopPropagation()}>
                  {video.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {isUploading ? "Uploading" : formatDuration(video)}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {isUploading ? "Uploading" : formatBytes(video.size)}
              </TableCell>
              <TableCell className="tabular-nums">
                {video.openFeedbackCount}
              </TableCell>
              <TableCell>
                {video.annotationsOpen ? (
                  <Badge variant="default">Open</Badge>
                ) : (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex flex-col">
                  <span>{video.uploadedBy ?? "Former member"}</span>
                  <span className="text-xs">
                    {new Date(video.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {video.shareUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (video.shareUrl) {
                        void handleCopy(video.shareUrl, video.id);
                      }
                    }}
                  >
                    {copied === video.id ? (
                      <>
                        <Check className="size-3 text-success" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        Copy link
                      </>
                    )}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function formatDuration(video: Video) {
  return video.durationMs === null ? "" : formatTimecode(video.durationMs);
}

type VideoPosterProps = {
  posterUrl: string | null;
};

function VideoPoster({ posterUrl }: VideoPosterProps) {
  if (!posterUrl) {
    return (
      <div className="flex aspect-video w-20 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <SquarePlay className="size-5" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Posters come from the deployment's own storage host, which is not in the static remotePatterns allowlist
    <img
      src={posterUrl}
      alt=""
      className="aspect-video w-20 rounded-md bg-muted object-cover"
    />
  );
}
