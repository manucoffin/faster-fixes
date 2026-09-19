import { NotFoundError } from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFeedbacks } from "./create-feedbacks";

type FakeDb = NonNullable<Parameters<typeof createFeedbacks>[1]>;

const ORGANIZATION_ID = "organization_1";
const ORGANIZATION_PROJECTS = [{ id: "project_1", publicId: "proj_public_1" }];
const REVIEWER_ID = "reviewer_1";

/** The Free plan's feedback ceiling, which the fake subscription row resolves to. */
const FREE_PLAN_FEEDBACK_LIMIT = 50;

const createdRow = {
  id: "feedback_2",
  status: "new",
  comment: "Typo in the footer",
  pageUrl: "https://client.test/",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

const feedbackItem = {
  comment: "Typo in the footer",
  pageUrl: "https://client.test/",
};

/**
 * A database with room left under the plan: no subscription row (Free plan),
 * an existing import reviewer, and a transaction that resolves its writes.
 */
function fakeDb(overrides: { feedbackCount?: number[] } = {}) {
  const counts = overrides.feedbackCount ?? [0, 0];
  const count = vi.fn();
  counts.forEach((value) => count.mockResolvedValueOnce(value));
  count.mockResolvedValue(counts[counts.length - 1] ?? 0);

  return {
    subscription: { findFirst: vi.fn().mockResolvedValue(null) },
    feedback: {
      count,
      create: vi.fn().mockResolvedValue(createdRow),
    },
    reviewer: {
      findFirst: vi.fn().mockResolvedValue({
        id: REVIEWER_ID,
        name: "Imported feedback",
        isActive: true,
      }),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
  } as unknown as FakeDb;
}

beforeEach(() => {
  // The plan resolver reads the cloud flag: without it every organization gets
  // the unlimited self-hosted plan and the limit branch is unreachable.
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createFeedbacks", () => {
  it("reports a project outside the token's organization as not found", async () => {
    const db = fakeDb();

    await expect(
      createFeedbacks(
        {
          project: "someone-elses",
          organizationId: ORGANIZATION_ID,
          organizationProjects: ORGANIZATION_PROJECTS,
          feedbacks: [feedbackItem],
        },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Project not found"));
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns the plan limit counters instead of importing a batch that would cross it", async () => {
    const db = fakeDb({ feedbackCount: [FREE_PLAN_FEEDBACK_LIMIT] });

    const result = await createFeedbacks(
      {
        project: "proj_public_1",
        organizationId: ORGANIZATION_ID,
        organizationProjects: ORGANIZATION_PROJECTS,
        feedbacks: [feedbackItem],
      },
      db,
    );

    expect(result).toEqual({
      limitExceeded: true,
      current: FREE_PLAN_FEEDBACK_LIMIT,
      limit: FREE_PLAN_FEEDBACK_LIMIT,
      requested: 1,
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("creates the batch and returns the resolved project and reviewer", async () => {
    const db = fakeDb();

    const result = await createFeedbacks(
      {
        project: "proj_public_1",
        organizationId: ORGANIZATION_ID,
        organizationProjects: ORGANIZATION_PROJECTS,
        source: "bugherd",
        feedbacks: [feedbackItem],
      },
      db,
    );

    expect(result).toEqual({
      limitExceeded: false,
      projectId: "project_1",
      feedbacks: [createdRow],
      reviewer: { id: REVIEWER_ID, name: "Imported feedback" },
      atLimit: false,
    });
    expect(db.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "project_1",
          reviewerId: REVIEWER_ID,
          status: "new",
          metadata: { source: "bugherd" },
        }),
      }),
    );
  });

  it("reports the caller as at the cap once the batch fills the plan", async () => {
    const db = fakeDb({
      feedbackCount: [FREE_PLAN_FEEDBACK_LIMIT - 1, FREE_PLAN_FEEDBACK_LIMIT],
    });

    const result = await createFeedbacks(
      {
        project: "proj_public_1",
        organizationId: ORGANIZATION_ID,
        organizationProjects: ORGANIZATION_PROJECTS,
        feedbacks: [feedbackItem],
      },
      db,
    );

    expect(result).toMatchObject({ limitExceeded: false, atLimit: true });
  });
});
