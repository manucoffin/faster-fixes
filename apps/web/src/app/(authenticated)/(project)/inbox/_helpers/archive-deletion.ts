type BulkDeleteResult = { deleted: number; requested: number };

export type BulkDeleteNotice = {
  tone: "success" | "warning" | "error";
  message: string;
};

export function getBulkDeleteNotice({
  deleted,
  requested,
}: BulkDeleteResult): BulkDeleteNotice {
  if (deleted === 0) {
    return {
      tone: "error",
      message: "No feedback deleted. The selection was no longer archived.",
    };
  }

  if (deleted < requested) {
    const skipped = requested - deleted;
    return {
      tone: "warning",
      message: `${deleted} of ${requested} deleted. ${skipped} ${skipped === 1 ? "was" : "were"} no longer archived.`,
    };
  }

  return {
    tone: "success",
    message:
      deleted === 1
        ? "Feedback deleted."
        : `${deleted} feedback items deleted.`,
  };
}

/** The page to show once `deleted` rows leave the archive, so a deletion never strands the table past its last page. */
export function getPageAfterDeletion({
  page,
  pageSize,
  totalCount,
  deleted,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  deleted: number;
}) {
  const lastPage = Math.max(1, Math.ceil((totalCount - deleted) / pageSize));
  return Math.min(page, lastPage);
}
