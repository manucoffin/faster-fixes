/**
 * `{title}-feedback.json` with the title reduced to lowercase ASCII words
 * joined by hyphens, so the name is safe on every file system. A title with
 * nothing left after that falls back to the Video id.
 */
export function getVideoFeedbackExportFileName(title: string, videoId: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || videoId}-feedback.json`;
}
