import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import { sortColumnFeedback } from "./board-column-order";

type ColumnFeedback = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  rank: string | null;
};

type RankPlacementInput = {
  column: ColumnFeedback[];
  movedId: string;
  beforeId: string | null;
  afterId: string | null;
};

export type RankWrite = { feedbackId: string; key: string };

// A neighbour missing from the column (moved elsewhere since the board loaded)
// is ignored, so the card falls back on the other one, then on the top.
function findInsertIndex(
  others: ColumnFeedback[],
  beforeId: string | null,
  afterId: string | null,
) {
  const beforeIndex = others.findIndex((f) => f.id === beforeId);
  if (beforeIndex !== -1) return beforeIndex + 1;
  const afterIndex = others.findIndex((f) => f.id === afterId);
  if (afterIndex !== -1) return afterIndex;
  return 0;
}

// Returns every Rank to write so the moved card sits between its neighbours in
// the Manual order of `column`, and nothing else in the column moves.
export function planRankPlacement({
  column,
  movedId,
  beforeId,
  afterId,
}: RankPlacementInput): RankWrite[] {
  const others = sortColumnFeedback(
    column.filter((f) => f.id !== movedId),
    "manual",
  );
  const index = findInsertIndex(others, beforeId, afterId);
  const unranked = others.filter((f) => f.rank === null);

  // Unranked cards always sort above ranked ones, so a ranked card cannot sit
  // among them. They are all ranked first, in the displayed order and above
  // the first ranked card, with the moved card at its slot.
  if (unranked.length > 0 && index <= unranked.length) {
    const ids = unranked.map((f) => f.id);
    ids.splice(index, 0, movedId);
    const firstRanked = others[unranked.length]?.rank ?? null;
    return generateNKeysBetween(null, firstRanked, ids.length).flatMap(
      (key, i) => {
        const feedbackId = ids[i];
        return feedbackId === undefined ? [] : [{ feedbackId, key }];
      },
    );
  }

  const lower = others[index - 1]?.rank ?? null;
  // Concurrent moves can leave two cards on one key. Skipping to the next
  // strictly greater key keeps the bounds valid for `generateKeyBetween`.
  const upper =
    others
      .slice(index)
      .find((f) => f.rank !== null && (lower === null || f.rank > lower))
      ?.rank ?? null;
  return [{ feedbackId: movedId, key: generateKeyBetween(lower, upper) }];
}
