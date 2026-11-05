import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/storage/get-signed-asset-url", () => ({
  getSignedAssetUrl: ({ key }: { key: string }, expiresIn = 3600) =>
    Promise.resolve(`https://storage.test/${key}?expires=${expiresIn}`),
}));

const { getVideoFeedbackExport } = await import("./get-video-feedback-export");

type FakeDb = NonNullable<Parameters<typeof getVideoFeedbackExport>[1]>;

type Membership = { organizationId: string; userId: string };

type FeedbackRow = ReturnType<typeof feedbackRow>;

type StatusFilter = string | { in?: string[]; notIn?: string[] };

function videoRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "video_1",
    title: "Launch cut",
    filename: "launch-cut.mp4",
    durationMs: 92_000,
    width: 1920,
    height: 1080,
    project: { organizationId: "org_1" },
    ...overrides,
  };
}

function feedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "feedback_1",
    videoId: "video_1",
    createdAt: new Date("2026-10-02T10:00:00Z"),
    status: "new",
    comment: "The logo is cut off",
    pageUrl: null,
    startMs: 4_000,
    endMs: null,
    frameX: 0.5,
    frameY: 0.25,
    frameWidth: null,
    frameHeight: null,
    clickX: null,
    clickY: null,
    selector: null,
    browserName: "Chrome",
    browserVersion: "142",
    os: "macOS",
    viewportWidth: null,
    viewportHeight: null,
    metadata: null,
    diagnosticTrail: null,
    customMetadata: null,
    reviewer: { name: "Client" },
    screenshot: { key: "frames/feedback_1.jpg", provider: "s3", bucket: null },
    ...overrides,
  };
}

function matchesStatus(status: string, filter: StatusFilter | undefined) {
  if (filter === undefined) return true;
  if (typeof filter === "string") return status === filter;
  if (filter.in && !filter.in.includes(status)) return false;
  return !filter.notIn?.includes(status);
}

// Honours the Video and Status filters, so a case asserts which Feedback come
// back rather than the shape of the query.
function fakeDb({
  video = videoRow() as ReturnType<typeof videoRow> | null,
  memberships = [{ organizationId: "org_1", userId: "user_1" }] as Membership[],
  feedback = [] as FeedbackRow[],
} = {}) {
  const db = {
    video: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(video?.id === where.id ? video : null),
      ),
    },
    member: {
      findFirst: vi.fn(({ where }: { where: Membership }) =>
        Promise.resolve(
          memberships.some(
            (m) =>
              m.organizationId === where.organizationId &&
              m.userId === where.userId,
          )
            ? { id: "member_1" }
            : null,
        ),
      ),
    },
    feedback: {
      findMany: vi.fn(
        ({ where }: { where: { videoId: string; status?: StatusFilter } }) =>
          Promise.resolve(
            feedback.filter(
              (row) =>
                row.videoId === where.videoId &&
                matchesStatus(row.status, where.status),
            ),
          ),
      ),
    },
  };
  return db as unknown as FakeDb;
}

const input = { videoId: "video_1", userId: "user_1" };

describe("getVideoFeedbackExport", () => {
  it("starts the document with the video block", async () => {
    const document = await getVideoFeedbackExport(input, fakeDb());

    expect(document).toEqual({
      video: {
        id: "video_1",
        title: "Launch cut",
        filename: "launch-cut.mp4",
        durationMs: 92_000,
        width: 1920,
        height: 1080,
      },
      feedbacks: [],
      count: 0,
    });
  });

  it("includes the Video's Feedback of every Status", async () => {
    const statuses = ["new", "in_progress", "resolved", "closed"];
    const db = fakeDb({
      feedback: [
        ...statuses.map((status) => feedbackRow({ id: status, status })),
        feedbackRow({ id: "elsewhere", videoId: "video_2" }),
      ],
    });

    const document = await getVideoFeedbackExport(input, db);

    expect(document.feedbacks.map((f) => f.status)).toEqual(statuses);
    expect(document.count).toBe(4);
  });

  it("serializes each item with its selection and a one hour screenshot url", async () => {
    const db = fakeDb({ feedback: [feedbackRow()] });

    const { feedbacks } = await getVideoFeedbackExport(input, db);

    expect(feedbacks[0]).toMatchObject({
      id: "feedback_1",
      videoId: "video_1",
      pageUrl: null,
      selection: {
        startMs: 4_000,
        endMs: null,
        point: { x: 0.5, y: 0.25 },
        area: null,
      },
      screenshotUrl: "https://storage.test/frames/feedback_1.jpg?expires=3600",
      reviewerName: "Client",
    });
  });

  it("refuses a Video of another Organization", async () => {
    const db = fakeDb({
      video: videoRow({ project: { organizationId: "org_2" } }),
      feedback: [feedbackRow()],
    });

    await expect(getVideoFeedbackExport(input, db)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("refuses a User who is not a Member", async () => {
    const db = fakeDb({ memberships: [], feedback: [feedbackRow()] });

    await expect(getVideoFeedbackExport(input, db)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("reports an unknown Video as not found", async () => {
    await expect(
      getVideoFeedbackExport(input, fakeDb({ video: null })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
