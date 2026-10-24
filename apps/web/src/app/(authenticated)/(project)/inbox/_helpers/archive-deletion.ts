/** The page to show once `removed` rows leave the archive (deleted or restored), so the table is never stranded past its last page. */
export function getPageAfterRemoval({
  page,
  pageSize,
  totalCount,
  removed,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  removed: number;
}) {
  const lastPage = Math.max(1, Math.ceil((totalCount - removed) / pageSize));
  return Math.min(page, lastPage);
}
