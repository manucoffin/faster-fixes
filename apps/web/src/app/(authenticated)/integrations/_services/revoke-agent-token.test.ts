import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { revokeAgentToken } from "./revoke-agent-token";

type FakeDb = NonNullable<Parameters<typeof revokeAgentToken>[1]>;

function fakeDb(
  membership: { id: string } | null,
  token: { id: string } | null,
) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    agentToken: {
      findFirst: vi.fn().mockResolvedValue(token),
      update: vi.fn().mockResolvedValue(token),
      delete: vi.fn(),
    },
  } as unknown as FakeDb;
}

const input = {
  organizationId: "org_1",
  tokenId: "token_1",
  userId: "user_1",
};

describe("revokeAgentToken", () => {
  it("refuses a caller who is neither owner nor admin of the organization", async () => {
    await expect(
      revokeAgentToken(input, fakeDb(null, { id: "token_1" })),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("reports a token of another organization as not found", async () => {
    await expect(
      revokeAgentToken(input, fakeDb({ id: "member_1" }, null)),
    ).rejects.toThrow(new NotFoundError("Token not found."));
  });

  it("deactivates the token instead of removing it", async () => {
    const db = fakeDb({ id: "member_1" }, { id: "token_1" });

    await expect(revokeAgentToken(input, db)).resolves.toEqual({
      id: "token_1",
    });
    expect(db.agentToken.update).toHaveBeenCalledWith({
      where: { id: "token_1" },
      data: { isActive: false, revokedAt: expect.any(Date) },
    });
    expect(db.agentToken.delete).not.toHaveBeenCalled();
  });
});
