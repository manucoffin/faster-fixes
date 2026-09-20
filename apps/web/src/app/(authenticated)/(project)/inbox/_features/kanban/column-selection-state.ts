/** What a column's select-all checkbox shows: all, some, or none of its items. */
export type ColumnSelectionState = boolean | "indeterminate";

export function getColumnSelectionState(
  itemIds: string[],
  selectedIds: Set<string>,
): ColumnSelectionState {
  if (itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id))) {
    return true;
  }

  if (itemIds.some((id) => selectedIds.has(id))) {
    return "indeterminate";
  }

  return false;
}
