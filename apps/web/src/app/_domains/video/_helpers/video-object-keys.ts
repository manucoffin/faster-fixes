const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export const VIDEO_MIME_TYPES = Object.keys(VIDEO_EXTENSIONS);

type VideoLocation = { projectId: string; id: string };

function getVideoFolder(video: VideoLocation) {
  return `videos/${video.projectId}/${video.id}/`;
}

export function getVideoSourceKey(video: VideoLocation & { mimeType: string }) {
  return `${getVideoFolder(video)}source.${VIDEO_EXTENSIONS[video.mimeType] ?? "mp4"}`;
}

export function getVideoPosterKey(video: VideoLocation) {
  return `${getVideoFolder(video)}poster.jpg`;
}

// One plain file name directly under the Video's folder: no subfolder, and no
// dot segment that could climb out of it on local disk.
export function isVideoObjectKey(video: VideoLocation, key: string) {
  const folder = getVideoFolder(video);
  return (
    key.startsWith(folder) && /^[\w-][\w.-]*$/.test(key.slice(folder.length))
  );
}
