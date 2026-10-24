/** Past participle of the bulk action a notice reports: rows leave the Archive either way. */
export type ArchiveBulkAction = "deleted" | "restored";

export type ArchiveBulkNotice = {
  tone: "success" | "warning" | "error";
  message: string;
};

export function getArchiveBulkNotice({
  action,
  count,
  requested,
}: {
  action: ArchiveBulkAction;
  count: number;
  requested: number;
}): ArchiveBulkNotice {
  if (count === 0) {
    return {
      tone: "error",
      message: `No feedback ${action}. The selection was no longer archived.`,
    };
  }

  if (count < requested) {
    const skipped = requested - count;
    return {
      tone: "warning",
      message: `${count} of ${requested} ${action}. ${skipped} ${skipped === 1 ? "was" : "were"} no longer archived.`,
    };
  }

  return {
    tone: "success",
    message:
      count === 1
        ? `Feedback ${action}.`
        : `${count} feedback items ${action}.`,
  };
}
