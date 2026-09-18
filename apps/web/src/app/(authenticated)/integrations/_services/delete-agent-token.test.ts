import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { deleteAgentToken } from "./delete-agent-token";

type FakeDb = NonNullable<Parameters<typeof deleteAgentToken>[1]>;

function fakeDb(
  membership: { id: string } | null,
  token: { id: string } | null,
) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    agentToken: {
      findFirst: vi.fn().mockResolvedValue(token),
      delete: vi.fn().mockResolvedValue(token),
    },
  } as unknown as FakeDb;
}

const input = {
  organizationId: "org_1",
  tokenId: "token_1",
  userId: "user_1",
};

describe("deleteAgentToken", () => {
  it("refuses a caller who is neither owner nor admin of the organization", async () => {
    await expect(
      deleteAgentToken(input, fakeDb(null, { id: "token_1" })),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("reports a token of another organization as not found", async () => {
    await expect(
      deleteAgentToken(input, fakeDb({ id: "member_1" }, null)),
    ).rejects.toThrow(new NotFoundError("Token not found."));
  });

  it("removes the token for an admin caller", async () => {
    const db = fakeDb({ id: "member_1" }, { id: "token_1" });

    await expect(deleteAgentToken(input, db)).resolves.toEqual({
      id: "token_1",
    });
    expect(db.agentToken.delete).toHaveBeenCalledWith({
      where: { id: "token_1" },
    });
  });
});
