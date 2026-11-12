// Masonry placement: each item, in order, goes to the currently shortest
// column, so reading order stays roughly left to right, top to bottom.
export function distributeIntoColumns(
  heights: number[],
  columnCount: number,
): number[][] {
  const columns = Array.from({ length: columnCount }, () => ({
    height: 0,
    indexes: [] as number[],
  }));

  heights.forEach((height, index) => {
    const shortest = columns.reduce((min, column) =>
      column.height < min.height ? column : min,
    );
    shortest.indexes.push(index);
    shortest.height += height;
  });

  return columns.map((column) => column.indexes);
}
