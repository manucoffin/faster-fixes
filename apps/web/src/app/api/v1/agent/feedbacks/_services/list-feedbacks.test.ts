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
  pageUrl: "https://client.test/checkout",
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
  reviewer: { name: "Dana" },
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

function fakeDb(rows: unknown[] = [feedbackRow]) {
  return {
    feedback: { findMany: vi.fn().mockResolvedValue(rows) },
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
        pageUrl: "https://client.test/checkout",
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

    expect(result).toEqual({ projectId: "project_1", items: [] });
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
});
