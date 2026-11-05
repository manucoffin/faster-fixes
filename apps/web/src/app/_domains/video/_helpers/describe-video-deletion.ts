/** The Delete dialog's description, naming the Feedback that goes with it. */
export function describeVideoDeletion(feedbackCount: number) {
  if (feedbackCount === 0) {
    return "This action is irreversible. The video and its share link will be permanently deleted.";
  }

  const feedback =
    feedbackCount === 1 ? "1 feedback item" : `${feedbackCount} feedback items`;

  return `This action is irreversible. The video, its share link and ${feedback} will be permanently deleted.`;
}
