import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkVideoQuota } from "./check-video-quota";

type FakeDb = Parameters<typeof checkVideoQuota>[2];

const MB = 1_000_000;
const GB = 1_000_000_000;

type VideoRow = { organizationId: string; size: bigint; state: string };

function fakeDb({
  plan,
  videos = [],
}: {
  plan: "pro" | "agency" | null;
  videos?: VideoRow[];
}) {
  type Query = { where: { project: { organizationId: string } } };
  const inOrganization = (where: Query["where"]): VideoRow[] =>
    videos.filter((v) => v.organizationId === where.project.organizationId);

  return {
    subscription: {
      findFirst: vi
        .fn()
        .mockResolvedValue(plan ? { plan, status: "active" } : null),
    },
    video: {
      count: vi.fn(({ where }: Query) =>
        Promise.resolve(inOrganization(where).length),
      ),
      aggregate: vi.fn(({ where }: Query) => {
        const rows = inOrganization(where);
        return Promise.resolve({
          _sum: {
            size: rows.length
              ? rows.reduce((sum, v) => sum + v.size, 0n)
              : null,
          },
        });
      }),
    },
  } as unknown as FakeDb;
}

function video(size: number, state = "ready"): VideoRow {
  return { organizationId: "org_1", size: BigInt(size), state };
}

describe("checkVideoQuota", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the first Video on Free", async () => {
    await expect(
      checkVideoQuota("org_1", 100 * MB, fakeDb({ plan: null })),
    ).resolves.toEqual({ allowed: true });
  });

  it("refuses a second Video on Free with the count and the limit", async () => {
    await expect(
      checkVideoQuota(
        "org_1",
        10 * MB,
        fakeDb({ plan: null, videos: [video(10 * MB)] }),
      ),
    ).resolves.toEqual({
      allowed: false,
      denial: { kind: "videoCount", count: 1, limit: 1 },
    });
  });

  it("counts an `uploading` Video toward the Free count", async () => {
    await expect(
      checkVideoQuota(
        "org_1",
        10 * MB,
        fakeDb({ plan: null, videos: [video(10 * MB, "uploading")] }),
      ),
    ).resolves.toMatchObject({ denial: { kind: "videoCount" } });
  });

  it("allows a file exactly at the per-file cap", async () => {
    await expect(
      checkVideoQuota("org_1", 2 * GB, fakeDb({ plan: "pro" })),
    ).resolves.toEqual({ allowed: true });
  });

  it("refuses a file above the per-file cap with the size and the cap", async () => {
    await expect(
      checkVideoQuota("org_1", 2 * GB + 1, fakeDb({ plan: "pro" })),
    ).resolves.toEqual({
      allowed: false,
      denial: { kind: "videoFileSize", size: 2 * GB + 1, cap: 2 * GB },
    });
  });

  it("allows a Pro upload that lands exactly on the budget", async () => {
    await expect(
      checkVideoQuota(
        "org_1",
        1 * GB,
        fakeDb({ plan: "pro", videos: [video(19 * GB)] }),
      ),
    ).resolves.toEqual({ allowed: true });
  });

  it("refuses a Pro upload the budget cannot hold with the used bytes and the budget", async () => {
    await expect(
      checkVideoQuota(
        "org_1",
        1 * GB,
        fakeDb({ plan: "pro", videos: [video(19 * GB), video(1)] }),
      ),
    ).resolves.toEqual({
      allowed: false,
      denial: { kind: "videoStorage", used: 19 * GB + 1, budget: 20 * GB },
    });
  });

  it("counts two `uploading` Videos toward the budget", async () => {
    await expect(
      checkVideoQuota(
        "org_1",
        1 * GB,
        fakeDb({
          plan: "pro",
          videos: [video(10 * GB, "uploading"), video(10 * GB, "uploading")],
        }),
      ),
    ).resolves.toEqual({
      allowed: false,
      denial: { kind: "videoStorage", used: 20 * GB, budget: 20 * GB },
    });
  });

  it("ignores another Organization's Videos", async () => {
    await expect(
      checkVideoQuota(
        "org_1",
        1 * GB,
        fakeDb({
          plan: "pro",
          videos: [
            { organizationId: "org_2", size: BigInt(20 * GB), state: "ready" },
          ],
        }),
      ),
    ).resolves.toEqual({ allowed: true });
  });

  it("allows anything off cloud without reading the database", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");
    const db = fakeDb({ plan: null, videos: [video(500 * MB)] });

    await expect(checkVideoQuota("org_1", 10 * GB, db)).resolves.toEqual({
      allowed: true,
    });
    expect(db.subscription.findFirst).not.toHaveBeenCalled();
    expect(db.video.aggregate).not.toHaveBeenCalled();
  });
});
