import type { PageParams } from "@/types/next";
import { VideoPage } from "./_features/video-page.client";

export default async function Page({
  params,
}: PageParams<{ videoId: string }>) {
  const { videoId } = await params;
  return <VideoPage videoId={videoId} />;
}
