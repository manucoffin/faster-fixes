import { generateShareLinkSecret } from "@/app/_domains/video/_helpers/share-link-secret";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/storage/get-signed-asset-url", () => ({
  getSignedAssetUrl: ({ key }: { key: string }, expiresIn = 3600) =>
    Promise.resolve(`https://storage.test/${key}?expires=${expiresIn}`),
}));

const { getVideo } = await import("./get-video");

type FakeDb = NonNullable<Parameters<typeof getVideo>[1]>;

type Membership = { organizationId: string; userId: string };

type FeedbackRow = ReturnType<typeof feedbackRow>;

type OrderBy = Partial<Record<"startMs" | "createdAt", "asc" | "desc">>[];

function videoRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "video_1",
    projectId: "project_1",
    title: "Launch cut",
    state: "ready",
    durationMs: 92_000,
    size: 48_000_000n,
    width: 1920,
    height: 1080,
    annotationsOpen: true,
    createdAt: new Date("2026-10-01T10:00:00Z"),
    shareTokenEncrypted: generateShareLinkSecret().encrypted,
    fileAsset: { key: "videos/video_1/file.mp4" },
    posterAsset: null,
    uploadedBy: { name: "Ada" },
    project: { organizationId: "org_1" },
    _count: { feedback: 0 },
    ...overrides,
  };
}

function feedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "feedback_1",
    videoId: "video_1",
    createdAt: new Date("2026-10-02T10:00:00Z"),
    updatedAt: new Date("2026-10-02T10:00:00Z"),
    status: "new",
    comment: "The logo is cut off",
    pageUrl: null,
    startMs: 4_000 as number | null,
    endMs: null as number | null,
    frameX: 0.5 as number | null,
    frameY: 0.25 as number | null,
    frameWidth: null as number | null,
    frameHeight: null as number | null,
    clickX: null,
    clickY: null,
    selector: null,
    browserName: null,
    browserVersion: null,
    os: null,
    viewportWidth: null,
    viewportHeight: null,
    metadata: null,
    customMetadata: null,
    reviewer: { id: "reviewer_1", name: "Client" },
    video: { title: "Launch cut" },
    assignee: null,
    screenshot: { id: "asset_1", key: "frames/feedback_1.jpg" },
    issueLink: null,
    linearIssueLink: null,
    jiraIssueLink: null,
    rank: null,
    ...overrides,
  };
}

// Honours the requested order and the Video filter, so a case asserts which
// Feedback comes back in which order rather than the shape of the query.
function sortRows(rows: FeedbackRow[], orderBy: OrderBy) {
  return [...rows].sort((a, b) => {
    for (const clause of orderBy) {
      const [field, direction] = Object.entries(clause)[0] as [
        "startMs" | "createdAt",
        "asc" | "desc",
      ];
      const left = Number(a[field] ?? 0);
      const right = Number(b[field] ?? 0);
      if (left !== right) {
        return direction === "asc" ? left - right : right - left;
      }
    }
    return 0;
  });
}

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
        ({
          where,
          orderBy,
        }: {
          where: { videoId: string };
          orderBy: OrderBy;
        }) =>
          Promise.resolve(
            sortRows(
              feedback.filter((row) => row.videoId === where.videoId),
              orderBy,
            ),
          ),
      ),
    },
  };
  return db as unknown as FakeDb;
}

const input = { videoId: "video_1", userId: "user_1" };

describe("getVideo", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-auth-secret");
    vi.stubEnv("BASE_URL", "https://app.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the row with a playback URL signed for one hour and the frame size", async () => {
    const shareLink = generateShareLinkSecret();
    const db = fakeDb({
      video: videoRow({ shareTokenEncrypted: shareLink.encrypted }),
    });

    await expect(getVideo(input, db)).resolves.toMatchObject({
      id: "video_1",
      projectId: "project_1",
      title: "Launch cut",
      size: 48_000_000,
      width: 1920,
      height: 1080,
      shareUrl: `https://app.test/review/${shareLink.secret}`,
      playbackUrl: "https://storage.test/videos/video_1/file.mp4?expires=3600",
    });
  });

  it("has no playback URL while the file is not uploaded", async () => {
    const db = fakeDb({
      video: videoRow({ state: "uploading", fileAsset: null }),
    });

    const video = await getVideo(input, db);
    expect(video.playbackUrl).toBeNull();
  });

  it("lists the Video's Feedback by in point with the video fields", async () => {
    const db = fakeDb({
      feedback: [
        feedbackRow({ id: "late", startMs: 60_000 }),
        feedbackRow({
          id: "range",
          startMs: 2_000,
          endMs: 8_000,
          frameX: 0.1,
          frameY: 0.2,
          frameWidth: 0.3,
          frameHeight: 0.4,
        }),
        feedbackRow({ id: "other", videoId: "video_2", startMs: 0 }),
        feedbackRow({
          id: "same-time-later",
          startMs: 2_000,
          createdAt: new Date("2026-10-03T10:00:00Z"),
        }),
      ],
    });

    const { feedback } = await getVideo(input, db);

    expect(feedback.map((item) => item.id)).toEqual([
      "range",
      "same-time-later",
      "late",
    ]);
    expect(feedback[0]).toMatchObject({
      videoId: "video_1",
      videoTitle: "Launch cut",
      startMs: 2_000,
      endMs: 8_000,
      frameX: 0.1,
      frameY: 0.2,
      frameWidth: 0.3,
      frameHeight: 0.4,
      pageUrl: null,
      screenshotUrl: "https://storage.test/frames/feedback_1.jpg?expires=3600",
    });
  });

  it("refuses a Video of an Organization the caller is not a Member of", async () => {
    const db = fakeDb({
      video: videoRow({ project: { organizationId: "org_2" } }),
      memberships: [{ organizationId: "org_1", userId: "user_1" }],
    });

    await expect(getVideo(input, db)).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
  });

  it("refuses a caller who is not a Member at all", async () => {
    const db = fakeDb({ memberships: [] });

    await expect(getVideo(input, db)).rejects.toThrow(
      new ForbiddenError("You are not a member of this project."),
    );
  });

  it("reports an unknown Video as not found", async () => {
    const db = fakeDb({ video: null });

    await expect(getVideo(input, db)).rejects.toThrow(
      new NotFoundError("Video not found."),
    );
  });
});
