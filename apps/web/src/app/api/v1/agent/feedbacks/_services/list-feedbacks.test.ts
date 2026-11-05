import { NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The storage adapter builds its R2 client at import time, so it is replaced at
// the module boundary. Everything else the service touches is injected.
const getSignedAssetUrlDouble = vi.hoisted(() => vi.fn());
vi.mock("@/server/storage/get-signed-asset-url", () => ({
  getSignedAssetUrl: getSignedAssetUrlDouble,
}));

const { listFeedbacks } = await import("./list-feedbacks");

type FakeDb = NonNullable<Parameters<typeof listFeedbacks>[1]>;

const ORGANIZATION_PROJECTS = [{ id: "project_1", publicId: "proj_public_1" }];

const SIGNED_ASSET_URL = "https://assets.example.test/signed";

const feedbackRow = {
  id: "feedback_1",
  status: "new",
  comment: "The submit button does nothing",
  videoId: null,
  pageUrl: "https://client.test/checkout",
  startMs: null,
  endMs: null,
  frameX: null,
  frameY: null,
  frameWidth: null,
  frameHeight: null,
  selector: "#submit",
  clickX: 12,
  clickY: 34,
  viewportWidth: 1280,
  viewportHeight: 800,
  browserName: "Chrome",
  browserVersion: "120",
  os: "macOS",
  screenshot: { key: "shot.png", provider: "s3", bucket: "assets" },
  metadata: { source: "bugherd" },
  diagnosticTrail: null,
  customMetadata: { userId: "user_42", beta: true },
  reviewer: { name: "Dana" },
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

const videoRow = {
  id: "video_1",
  title: "Homepage walkthrough v1",
  filename: "homepage-walkthrough.mp4",
  durationMs: 94200,
  width: 1920,
  height: 1080,
};

function fakeDb(rows: unknown[] = [feedbackRow], video: unknown = videoRow) {
  return {
    feedback: { findMany: vi.fn().mockResolvedValue(rows) },
    video: { findFirst: vi.fn().mockResolvedValue(video) },
  } as unknown as FakeDb;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSignedAssetUrlDouble.mockResolvedValue(SIGNED_ASSET_URL);
});

describe("listFeedbacks", () => {
  it("reports a project outside the token's organization as not found", async () => {
    const db = fakeDb();

    await expect(
      listFeedbacks(
        {
          project: "someone-elses",
          organizationProjects: ORGANIZATION_PROJECTS,
        },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Project not found"));
    expect(db.feedback.findMany).not.toHaveBeenCalled();
  });

  it("returns the resolved project and its feedback as plain data", async () => {
    const result = await listFeedbacks(
      {
        project: "proj_public_1",
        organizationProjects: ORGANIZATION_PROJECTS,
      },
      fakeDb(),
    );

    expect(result.projectId).toBe("project_1");
    expect(getSignedAssetUrlDouble).toHaveBeenCalledWith({
      key: "shot.png",
      provider: "s3",
      bucket: "assets",
    });
    expect(result.items).toEqual([
      {
        id: "feedback_1",
        status: "new",
        comment: "The submit button does nothing",
        videoId: null,
        pageUrl: "https://client.test/checkout",
        selection: null,
        selector: "#submit",
        clickX: 12,
        clickY: 34,
        viewportWidth: 1280,
        viewportHeight: 800,
        browserName: "Chrome",
        browserVersion: "120",
        os: "macOS",
        screenshotUrl: SIGNED_ASSET_URL,
        metadata: { source: "bugherd" },
        diagnosticTrail: null,
        customMetadata: { userId: "user_42", beta: true },
        reviewerName: "Dana",
        createdAt: new Date("2026-01-02T03:04:05.000Z"),
      },
    ]);
  });

  it("accepts the project's internal id as well as its public one", async () => {
    const result = await listFeedbacks(
      { project: "project_1", organizationProjects: ORGANIZATION_PROJECTS },
      fakeDb([]),
    );

    expect(result).toEqual({ projectId: "project_1", video: null, items: [] });
  });

  it("narrows the read to the requested status and page url", async () => {
    const db = fakeDb([]);

    await listFeedbacks(
      {
        project: "proj_public_1",
        organizationProjects: ORGANIZATION_PROJECTS,
        status: "resolved",
        pageUrl: "https://client.test/checkout",
      },
      db,
    );

    expect(db.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId: "project_1",
          status: "resolved",
          pageUrl: "https://client.test/checkout",
        },
      }),
    );
  });

  it("opens a listing filtered on a Video with its block", async () => {
    const db = fakeDb([]);

    const result = await listFeedbacks(
      {
        project: "proj_public_1",
        organizationProjects: ORGANIZATION_PROJECTS,
        videoId: "video_1",
      },
      db,
    );

    expect(result.video).toEqual(videoRow);
    expect(db.video.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "video_1", projectId: "project_1" },
      }),
    );
    expect(db.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: "project_1", videoId: "video_1" },
      }),
    );
  });

  it("leaves the video block out of an unfiltered listing", async () => {
    const db = fakeDb([]);

    const result = await listFeedbacks(
      { project: "proj_public_1", organizationProjects: ORGANIZATION_PROJECTS },
      db,
    );

    expect(result.video).toBeNull();
    expect(db.video.findFirst).not.toHaveBeenCalled();
  });

  it("reports a Video outside the resolved Project as not found", async () => {
    const db = fakeDb([], null);

    await expect(
      listFeedbacks(
        {
          project: "proj_public_1",
          organizationProjects: ORGANIZATION_PROJECTS,
          videoId: "video_1",
        },
        db,
      ),
    ).rejects.toThrow(new NotFoundError("Video not found"));
    expect(db.feedback.findMany).not.toHaveBeenCalled();
  });
});
