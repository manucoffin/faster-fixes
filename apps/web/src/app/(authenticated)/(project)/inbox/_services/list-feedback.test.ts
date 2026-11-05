import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { listFeedback } from "./list-feedback";

vi.mock("@/server/storage/get-signed-asset-url", () => ({
  getSignedAssetUrl: vi.fn().mockResolvedValue("https://signed.example/x"),
}));

type FakeDb = NonNullable<Parameters<typeof listFeedback>[1]>;

const baseRow = {
  createdAt: new Date("2026-11-01T00:00:00Z"),
  updatedAt: new Date("2026-11-01T00:00:00Z"),
  status: "new",
  comment: "Fix this",
  clickX: null,
  clickY: null,
  selector: null,
  browserName: null,
  browserVersion: null,
  os: null,
  viewportWidth: null,
  viewportHeight: null,
  reviewer: { id: "reviewer_1", name: "Ada" },
  assignee: null,
  screenshot: null,
  metadata: null,
  customMetadata: null,
  issueLink: null,
  linearIssueLink: null,
  jiraIssueLink: null,
  rank: null,
};

const pageRow = {
  ...baseRow,
  id: "page_feedback",
  pageUrl: "https://example.com/pricing",
  videoId: null,
  video: null,
  startMs: null,
  endMs: null,
  frameX: null,
  frameY: null,
  frameWidth: null,
  frameHeight: null,
};

const videoRow = {
  ...baseRow,
  id: "video_feedback",
  pageUrl: null,
  videoId: "video_1",
  video: { title: "Launch teaser" },
  startMs: 12_000,
  endMs: 15_500,
  frameX: 0.1,
  frameY: 0.2,
  frameWidth: 0.3,
  frameHeight: 0.4,
};

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: { findMany: vi.fn().mockResolvedValue([videoRow, pageRow]) },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("listFeedback", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      listFeedback(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(
      listFeedback(input, fakeDb({ organizationId: "org_1" }, null)),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("carries the Video, its points and the frame selection on a video Feedback", async () => {
    const [video] = await listFeedback(
      input,
      fakeDb({ organizationId: "org_1" }, { id: "member_1" }),
    );

    expect(video).toMatchObject({
      id: "video_feedback",
      videoId: "video_1",
      videoTitle: "Launch teaser",
      startMs: 12_000,
      endMs: 15_500,
      frameX: 0.1,
      frameY: 0.2,
      frameWidth: 0.3,
      frameHeight: 0.4,
    });
  });

  it("carries nulls for the video fields on a page Feedback", async () => {
    const [, page] = await listFeedback(
      input,
      fakeDb({ organizationId: "org_1" }, { id: "member_1" }),
    );

    expect(page).toMatchObject({
      id: "page_feedback",
      pageUrl: "https://example.com/pricing",
      videoId: null,
      videoTitle: null,
      startMs: null,
      endMs: null,
      frameX: null,
      frameY: null,
      frameWidth: null,
      frameHeight: null,
    });
  });
});
