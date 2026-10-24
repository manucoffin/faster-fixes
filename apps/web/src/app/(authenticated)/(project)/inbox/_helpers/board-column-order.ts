export const BOARD_SORTS = ["manual", "newest", "oldest", "updated"] as const;

export type BoardSort = (typeof BOARD_SORTS)[number];

export const DEFAULT_BOARD_SORT: BoardSort = "manual";

type ColumnFeedback = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  rank: string | null;
};

// Fractional-index keys order by code unit, so `localeCompare` would misplace them.
function compareStrings(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function compareManual(a: ColumnFeedback, b: ColumnFeedback) {
  // Unranked Feedback still needs sorting, so it sits on top, newest first.
  if (a.rank === null && b.rank === null) {
    return b.createdAt.getTime() - a.createdAt.getTime();
  }
  if (a.rank === null) return -1;
  if (b.rank === null) return 1;
  return compareStrings(a.rank, b.rank) || compareStrings(a.id, b.id);
}

export function sortColumnFeedback<T extends ColumnFeedback>(
  items: T[],
  sort: BoardSort,
): T[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "manual":
        return compareManual(a, b);
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "updated":
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
}

// `dropIndex` is the slot in the column once the moved card is taken out of it,
// which is how dnd-kit sortable reports a drop.
export function resolveDropNeighbours(
  columnIds: string[],
  movedId: string,
  dropIndex: number,
) {
  const others = columnIds.filter((id) => id !== movedId);
  const index = Math.min(Math.max(dropIndex, 0), others.length);
  return {
    beforeId: others[index - 1] ?? null,
    afterId: others[index] ?? null,
  };
}
