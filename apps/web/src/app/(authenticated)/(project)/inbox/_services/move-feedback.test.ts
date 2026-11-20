import { inMemoryStatusConvergence } from "@/app/_domains/integration/_services/_in-memory-status-convergence";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { moveFeedback } from "./move-feedback";

type FakeDb = NonNullable<Parameters<typeof moveFeedback>[1]>;

type ColumnRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  rank: { key: string } | null;
};

function row(id: string, rank: string | null, createdAt = "2026-10-01") {
  return {
    id,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    rank: rank === null ? null : { key: rank },
  };
}

function fakeDb({
  project = { organizationId: "org_1" } as { organizationId: string } | null,
  membership = { id: "member_1" } as { id: string } | null,
  target = { id: "moved", status: "new" } as {
    id: string;
    status: string;
  } | null,
  column = [] as ColumnRow[],
} = {}) {
  const upsert = vi.fn(
    (args: { where: { feedbackId: string }; update: { key: string } }) => ({
      feedbackId: args.where.feedbackId,
      key: args.update.key,
    }),
  );
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: {
      findFirst: vi.fn().mockResolvedValue(target),
      // Read by the Status service on a move to another column.
      findUnique: vi
        .fn()
        .mockResolvedValue(
          target && { ...target, project: { organizationId: "org_1" } },
        ),
      findMany: vi.fn().mockResolvedValue(column),
    },
    feedbackRank: { upsert },
    $transaction: vi.fn((ops: unknown[]) => Promise.resolve(ops)),
  } as unknown as FakeDb & { feedbackRank: { upsert: typeof upsert } };
}

// The moved card starts in `new`; `writeStatuses` is spied for the call order.
function fakeConvergence() {
  const convergence = inMemoryStatusConvergence({ moved: "new" });
  const writeStatuses = vi.fn(convergence.store.writeStatuses);
  return { ...convergence, store: { writeStatuses } };
}

// The keys written, in the order they sort.
function writtenOrder(db: ReturnType<typeof fakeDb>) {
  return db.feedbackRank.upsert.mock.calls
    .map(([args]) => ({ id: args.where.feedbackId, key: args.update.key }))
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((write) => write.id);
}

function keyOf(db: ReturnType<typeof fakeDb>, id: string) {
  const call = db.feedbackRank.upsert.mock.calls.find(
    ([args]) => args.where.feedbackId === id,
  );
  return call?.[0].update.key;
}

const input = {
  projectId: "project_1",
  feedbackId: "moved",
  status: "new" as const,
  beforeId: null,
  afterId: null,
  userId: "user_1",
};

describe("moveFeedback", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      moveFeedback(input, fakeDb({ project: null })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const db = fakeDb({ membership: null });

    await expect(moveFeedback(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.feedbackRank.upsert).not.toHaveBeenCalled();
  });

  it("ignores a Feedback outside the project without reporting it", async () => {
    const db = fakeDb({ target: null });

    await expect(moveFeedback(input, db)).resolves.toEqual({ moved: false });
    expect(db.feedback.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "moved", projectId: "project_1" },
      }),
    );
    expect(db.feedbackRank.upsert).not.toHaveBeenCalled();
  });

  it("writes a key strictly between two ranked neighbours", async () => {
    const db = fakeDb({
      column: [row("a", "a0"), row("b", "a1"), row("moved", "a2")],
    });

    await expect(
      moveFeedback({ ...input, beforeId: "a", afterId: "b" }, db),
    ).resolves.toEqual({ moved: true });

    const key = keyOf(db, "moved")!;
    expect(key > "a0" && key < "a1").toBe(true);
    expect(db.feedbackRank.upsert).toHaveBeenCalledTimes(1);
  });

  it("moves a card to the top of a ranked column", async () => {
    const db = fakeDb({
      column: [row("a", "a0"), row("b", "a1"), row("moved", "a2")],
    });

    await moveFeedback({ ...input, afterId: "a" }, db);

    expect(keyOf(db, "moved")! < "a0").toBe(true);
  });

  it("moves a card to the bottom of a ranked column", async () => {
    const db = fakeDb({
      column: [row("moved", "a0"), row("a", "a1"), row("b", "a2")],
    });

    await moveFeedback({ ...input, beforeId: "b" }, db);

    expect(keyOf(db, "moved")! > "a2").toBe(true);
  });

  it("ranks the unranked cards in the displayed order when dropped among them", async () => {
    const db = fakeDb({
      column: [
        row("ranked", "a0"),
        row("old", null, "2026-10-01"),
        row("middle", null, "2026-10-02"),
        row("recent", null, "2026-10-03"),
        row("moved", "a1"),
      ],
    });

    // The board shows recent, middle, old, ranked; the card lands after middle.
    await moveFeedback({ ...input, beforeId: "middle", afterId: "old" }, db);

    expect(writtenOrder(db)).toEqual(["recent", "middle", "moved", "old"]);
    for (const id of ["recent", "middle", "moved", "old"]) {
      expect(keyOf(db, id)! < "a0").toBe(true);
    }
  });

  it("ignores a neighbour that left the column", async () => {
    const db = fakeDb({
      column: [row("a", "a0"), row("b", "a1"), row("moved", "a2")],
    });

    await moveFeedback({ ...input, beforeId: "gone", afterId: "b" }, db);

    const key = keyOf(db, "moved")!;
    expect(key > "a0" && key < "a1").toBe(true);
  });

  it("never updates the Feedback row and announces nothing", async () => {
    const db = fakeDb({ column: [row("a", "a0"), row("moved", "a1")] });
    const convergence = fakeConvergence();

    await moveFeedback({ ...input, afterId: "a" }, db, convergence);

    expect(convergence.store.writeStatuses).not.toHaveBeenCalled();
    expect(convergence.events).toEqual([]);
  });

  describe("to another column", () => {
    const crossColumn = { ...input, status: "in_progress" as const };

    it("changes the Status once, then ranks the card between its neighbours", async () => {
      const db = fakeDb({
        column: [row("a", "a0"), row("b", "a1"), row("moved", null)],
      });
      const convergence = fakeConvergence();

      await expect(
        moveFeedback(
          { ...crossColumn, beforeId: "a", afterId: "b" },
          db,
          convergence,
        ),
      ).resolves.toEqual({ moved: true });

      expect(convergence.store.writeStatuses).toHaveBeenCalledTimes(1);
      expect(convergence.statuses.get("moved")).toBe("in_progress");
      expect(convergence.events).toEqual([
        { feedbackId: "moved", newStatus: "in_progress", actor: "user" },
      ]);
      expect(db.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: "project_1", status: "in_progress" },
        }),
      );
      const key = keyOf(db, "moved")!;
      expect(key > "a0" && key < "a1").toBe(true);
    });

    // The trigger clears the Rank on a Status change (ADR-0017), so a Rank
    // written first would be lost.
    it("writes the Rank after the Status change", async () => {
      const db = fakeDb({ column: [row("a", "a0"), row("moved", null)] });
      const convergence = fakeConvergence();

      await moveFeedback({ ...crossColumn, beforeId: "a" }, db, convergence);

      const statusOrder =
        convergence.store.writeStatuses.mock.invocationCallOrder[0]!;
      const rankOrder = db.feedbackRank.upsert.mock.invocationCallOrder[0]!;
      expect(statusOrder).toBeLessThan(rankOrder);
    });

    it("ranks the card in an empty column", async () => {
      const db = fakeDb({ column: [row("moved", null)] });
      const convergence = fakeConvergence();

      await moveFeedback(crossColumn, db, convergence);

      expect(writtenOrder(db)).toEqual(["moved"]);
      expect(convergence.events).toHaveLength(1);
    });

    it("keeps the displayed order when dropped among unranked cards", async () => {
      const db = fakeDb({
        column: [
          row("ranked", "a0"),
          row("old", null, "2026-10-01"),
          row("recent", null, "2026-10-03"),
          row("moved", null, "2026-10-02"),
        ],
      });

      const convergence = fakeConvergence();

      // The target column shows recent, old, ranked; the card lands after recent.
      await moveFeedback(
        { ...crossColumn, beforeId: "recent", afterId: "old" },
        db,
        convergence,
      );

      expect(writtenOrder(db)).toEqual(["recent", "moved", "old"]);
      for (const id of ["recent", "moved", "old"]) {
        expect(keyOf(db, id)! < "a0").toBe(true);
      }
      expect(convergence.events).toHaveLength(1);
    });

    it("refuses a caller who is not a member before changing anything", async () => {
      const db = fakeDb({ membership: null });
      const convergence = fakeConvergence();

      await expect(moveFeedback(crossColumn, db, convergence)).rejects.toThrow(
        new ForbiddenError("Access denied."),
      );
      expect(convergence.statuses.get("moved")).toBe("new");
      expect(convergence.events).toEqual([]);
    });
  });
});
