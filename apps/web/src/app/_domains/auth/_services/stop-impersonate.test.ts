import { BadRequestError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionApi = vi.fn();
const stopImpersonatingApi = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: {
    api: { getSession: getSessionApi, stopImpersonating: stopImpersonatingApi },
  },
}));

const { stopImpersonate } = await import("./stop-impersonate");

const headers = new Headers();

describe("stopImpersonate", () => {
  beforeEach(() => {
    getSessionApi.mockReset();
    stopImpersonatingApi.mockReset();
  });

  it("refuses a caller who is not impersonating anyone", async () => {
    getSessionApi.mockResolvedValue({ session: { impersonatedBy: null } });

    await expect(stopImpersonate({ headers })).rejects.toThrow(
      new BadRequestError("User is not currently impersonating"),
    );
    await expect(stopImpersonate({ headers })).rejects.toBeInstanceOf(
      BadRequestError,
    );
    expect(stopImpersonatingApi).not.toHaveBeenCalled();
  });

  it("refuses a caller with no session at all", async () => {
    getSessionApi.mockResolvedValue(null);

    await expect(stopImpersonate({ headers })).rejects.toThrow(
      new BadRequestError("User is not currently impersonating"),
    );
    expect(stopImpersonatingApi).not.toHaveBeenCalled();
  });

  it("returns the restored admin session when an impersonation is active", async () => {
    getSessionApi.mockResolvedValue({
      session: { impersonatedBy: "admin_1" },
    });
    const session = { user: { id: "admin_1" } };
    stopImpersonatingApi.mockResolvedValue(session);

    await expect(stopImpersonate({ headers })).resolves.toEqual({
      success: true,
      session,
    });
    expect(stopImpersonatingApi).toHaveBeenCalledWith({ headers });
  });
});
