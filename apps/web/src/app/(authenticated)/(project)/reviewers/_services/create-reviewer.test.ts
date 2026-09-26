import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import crypto from "crypto";
import { describe, expect, it, vi } from "vitest";
import { createReviewer } from "./create-reviewer";

type FakeDb = NonNullable<Parameters<typeof createReviewer>[1]>;

function fakeDb(
  project: { organizationId: string; domain: string } | null,
  membership: { id: string } | null,
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    reviewer: {
      create: vi
        .fn()
        .mockImplementation(({ data }: { data: { name: string } }) =>
          Promise.resolve({ id: "reviewer_1", name: data.name }),
        ),
    },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", name: "Marie", userId: "user_1" };
const project = { organizationId: "org_1", domain: "example.com" };

describe("createReviewer", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      createReviewer(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not an owner or an admin of the organization", async () => {
    const db = fakeDb(project, null);

    await expect(createReviewer(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        userId: "user_1",
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("persists only the hash of the token it returns", async () => {
    const db = fakeDb(project, { id: "member_1" });

    const result = await createReviewer(input, db);

    const persisted = vi.mocked(db.reviewer.create).mock.calls[0]![0].data
      .token;
    expect(persisted).toBe(
      crypto.createHash("sha256").update(result.token).digest("hex"),
    );
    expect(persisted).not.toBe(result.token);
  });

  it("returns a share URL carrying the raw token on the project domain", async () => {
    const db = fakeDb(project, { id: "member_1" });

    const result = await createReviewer(input, db);

    expect(result).toMatchObject({ id: "reviewer_1", name: "Marie" });
    expect(result.shareUrl).toBe(
      `https://example.com?ff_token=${result.token}`,
    );
  });
});
