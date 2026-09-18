import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createInvitationApi = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { createInvitation: createInvitationApi } },
}));

const { createInvitation } = await import("./create-invitation");

type FakeDb = NonNullable<Parameters<typeof createInvitation>[1]>;

function fakeDb(membership: { id: string } | null) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const input = {
  organizationId: "org_1",
  email: "invitee@example.com",
  role: "member" as const,
  userId: "user_1",
  headers: new Headers(),
};

describe("createInvitation", () => {
  beforeEach(() => {
    createInvitationApi.mockReset();
  });

  it("refuses a caller who is neither owner nor admin of the organization", async () => {
    await expect(createInvitation(input, fakeDb(null))).rejects.toThrow(
      new ForbiddenError("You do not have permission to invite members."),
    );
    expect(createInvitationApi).not.toHaveBeenCalled();
  });

  it("reports a Better Auth refusal with its own message", async () => {
    createInvitationApi.mockRejectedValue(
      new Error("User is already invited to this organization"),
    );

    await expect(
      createInvitation(input, fakeDb({ id: "member_1" })),
    ).rejects.toThrow(
      new BadRequestError("User is already invited to this organization"),
    );
  });

  it("returns the invitation Better Auth issued", async () => {
    const invitation = { id: "invitation_1", email: input.email };
    createInvitationApi.mockResolvedValue(invitation);

    await expect(
      createInvitation(input, fakeDb({ id: "member_1" })),
    ).resolves.toBe(invitation);
    expect(createInvitationApi).toHaveBeenCalledWith({
      body: {
        email: input.email,
        role: "member",
        organizationId: "org_1",
      },
      headers: input.headers,
    });
  });
});
