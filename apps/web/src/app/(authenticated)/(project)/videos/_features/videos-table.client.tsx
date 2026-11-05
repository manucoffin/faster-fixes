"use client";

import { formatBytes } from "@/app/_domains/video/_helpers/format-bytes";
import { formatTimecode } from "@/app/_domains/video/_helpers/format-timecode";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { SquarePlay } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ListVideosOutput } from "../_services/list-videos";
import { VideoRowMenu } from "./video-row-menu/video-row-menu.client";

type VideosTableProps = {
  videos: ListVideosOutput;
  projectId: string;
};

type Video = ListVideosOutput[number];

export function VideosTable({ videos, projectId }: VideosTableProps) {
  const router = useRouter();

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
          <TableHead className="w-10" />
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
                <VideoRowMenu video={video} projectId={projectId} />
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
