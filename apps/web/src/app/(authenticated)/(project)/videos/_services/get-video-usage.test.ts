import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getVideoUsage } from "./get-video-usage";

type FakeDb = NonNullable<Parameters<typeof getVideoUsage>[1]>;

const MB = 1_000_000;
const GB = 1_000_000_000;

type VideoRow = { organizationId: string; size: bigint };

type VideoQuery = { where: { project: { organizationId: string } } };

function fakeDb({
  plan = null as "pro" | "agency" | null,
  videos = [] as VideoRow[],
  project = { organizationId: "org_1" } as { organizationId: string } | null,
  membership = { id: "member_1" } as { id: string } | null,
} = {}) {
  const inOrganization = ({ where }: VideoQuery) =>
    videos.filter(
      (video) => video.organizationId === where.project.organizationId,
    );

  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    subscription: {
      findFirst: vi
        .fn()
        .mockResolvedValue(plan ? { plan, status: "active" } : null),
    },
    video: {
      count: vi.fn((query: VideoQuery) =>
        Promise.resolve(inOrganization(query).length),
      ),
      aggregate: vi.fn((query: VideoQuery) => {
        const rows = inOrganization(query);
        return Promise.resolve({
          _sum: {
            size: rows.length
              ? rows.reduce((sum, video) => sum + video.size, 0n)
              : null,
          },
        });
      }),
    },
  } as unknown as FakeDb;
}

// Projects are not modelled: a row belongs to its Organization whichever
// Project carries it, which is what the Organization-wide sum must see.
function video(size: number, organizationId = "org_1"): VideoRow {
  return { organizationId, size: BigInt(size) };
}

describe("getVideoUsage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("counts and sums every Video of the Organization, not of other ones", async () => {
    const db = fakeDb({
      plan: "pro",
      videos: [video(3 * GB), video(1_200_000_000), video(5 * GB, "org_2")],
    });

    await expect(
      getVideoUsage({ projectId: "project_1", userId: "user_1" }, db),
    ).resolves.toEqual({
      isCloud: true,
      plan: "pro",
      videoCount: 2,
      videoLimit: null,
      usedBytes: 4_200_000_000,
      budgetBytes: 20 * GB,
      fileSizeCapBytes: 2 * GB,
    });
  });

  it("answers the Free count limit and zero bytes for an empty Organization", async () => {
    await expect(
      getVideoUsage({ projectId: "project_1", userId: "user_1" }, fakeDb()),
    ).resolves.toEqual({
      isCloud: true,
      plan: "free",
      videoCount: 0,
      videoLimit: 1,
      usedBytes: 0,
      budgetBytes: 500 * MB,
      fileSizeCapBytes: 500 * MB,
    });
  });

  it("answers isCloud false alone off cloud", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");

    await expect(
      getVideoUsage(
        { projectId: "project_1", userId: "user_1" },
        fakeDb({ videos: [video(GB)] }),
      ),
    ).resolves.toEqual({ isCloud: false });
  });

  it("refuses a non-Member", async () => {
    await expect(
      getVideoUsage(
        { projectId: "project_1", userId: "user_1" },
        fakeDb({ membership: null }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses an unknown Project", async () => {
    await expect(
      getVideoUsage(
        { projectId: "project_1", userId: "user_1" },
        fakeDb({ project: null }),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
