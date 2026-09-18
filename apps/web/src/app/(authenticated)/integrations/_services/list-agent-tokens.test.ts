import { ForbiddenError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { listAgentTokens } from "./list-agent-tokens";

type FakeDb = NonNullable<Parameters<typeof listAgentTokens>[1]>;

function fakeDb(membership: { id: string } | null) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    agentToken: { findMany: vi.fn().mockResolvedValue([{ id: "token_1" }]) },
  } as unknown as FakeDb;
}

const input = { organizationId: "org_1", userId: "user_1" };

describe("listAgentTokens", () => {
  it("refuses a caller who is not a member of the organization", async () => {
    await expect(listAgentTokens(input, fakeDb(null))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
  });

  it("lists the tokens for a plain member, without requiring a role", async () => {
    const db = fakeDb({ id: "member_1" });

    await expect(listAgentTokens(input, db)).resolves.toEqual([
      { id: "token_1" },
    ]);
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1" },
    });
  });
});
