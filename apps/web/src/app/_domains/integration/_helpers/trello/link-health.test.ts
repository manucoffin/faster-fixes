import { describe, expect, it } from "vitest";
import { resolveTrelloLinkHealth, type TrelloBoardState } from "./link-health";

const mapping = {
  newListId: "list_new",
  inProgressListId: "list_doing",
  resolvedListId: "list_done",
};

function board(
  overrides: Partial<NonNullable<TrelloBoardState>> = {},
): TrelloBoardState {
  return {
    closed: false,
    lists: [
      { id: "list_new", closed: false },
      { id: "list_doing", closed: false },
      { id: "list_done", closed: false },
    ],
    ...overrides,
  };
}

describe("resolveTrelloLinkHealth", () => {
  it.each([
    { case: "every mapped list open", state: board(), expected: null },
    {
      case: "the board out of reach",
      state: null,
      expected: "board_unreachable",
    },
    {
      case: "the board closed",
      state: board({ closed: true }),
      expected: "board_closed",
    },
    {
      case: "a mapped list archived",
      state: board({
        lists: [
          { id: "list_new", closed: false },
          { id: "list_doing", closed: true },
          { id: "list_done", closed: false },
        ],
      }),
      expected: "stale_list",
    },
    {
      case: "a mapped list deleted",
      state: board({
        lists: [
          { id: "list_new", closed: false },
          { id: "list_doing", closed: false },
        ],
      }),
      expected: "stale_list",
    },
  ])("answers $expected for $case", ({ state, expected }) => {
    expect(resolveTrelloLinkHealth(state, mapping)).toBe(expected);
  });

  it("ignores an archived list no Status is mapped to", () => {
    expect(
      resolveTrelloLinkHealth(
        board({
          lists: [
            { id: "list_new", closed: false },
            { id: "list_doing", closed: true },
            { id: "list_done", closed: false },
          ],
        }),
        { ...mapping, inProgressListId: null },
      ),
    ).toBeNull();
  });
});
