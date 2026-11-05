export const VIDEO_TITLE_MAX_LENGTH = 120;

/** "Client cut v2.final.mp4" gives "Client cut v2.final". */
export function getVideoTitleFromFileName(fileName: string) {
  const title = fileName.replace(/\.[^.]*$/, "").trim() || fileName.trim();
  return title.slice(0, VIDEO_TITLE_MAX_LENGTH).trim();
}
