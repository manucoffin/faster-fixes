import { NotFoundError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteStorageObjects = vi.fn<(keys: string[]) => Promise<unknown>>();

vi.mock("@/server/storage/objects", () => ({
  deleteStorageObjects: (keys: string[]) => deleteStorageObjects(keys),
}));

const { deleteUser } = await import("./delete-user");

function fakeDb(
  user: { id: string } | null,
  testimonials: { photoKey: string | null }[] = [],
) {
  return {
    testimonial: {
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        where.userId === user?.id
          ? testimonials.filter(({ photoKey }) => photoKey)
          : [],
      ),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
      delete: vi
        .fn()
        .mockResolvedValue({ id: "user_1", email: "gone@example.com" }),
    },
  } as unknown as NonNullable<Parameters<typeof deleteUser>[1]>;
}

describe("deleteUser", () => {
  beforeEach(() => {
    deleteStorageObjects.mockReset().mockResolvedValue({ errors: [] });
  });

  it("reports an unknown User as a not found domain error", async () => {
    await expect(
      deleteUser({ userId: "absent" }, fakeDb(null)),
    ).rejects.toThrow(new NotFoundError("User not found"));
  });

  it("returns the deleted identifiers", async () => {
    await expect(
      deleteUser({ userId: "user_1" }, fakeDb({ id: "user_1" })),
    ).resolves.toEqual({
      success: true,
      user: { id: "user_1", email: "gone@example.com" },
    });
  });

  it("deletes the Testimonial photo object of the User", async () => {
    await deleteUser(
      { userId: "user_1" },
      fakeDb({ id: "user_1" }, [
        { photoKey: "testimonial-photos/request_1/100.png" },
      ]),
    );

    expect(deleteStorageObjects).toHaveBeenCalledWith([
      "testimonial-photos/request_1/100.png",
    ]);
  });

  it("touches no storage when the User has no Testimonial photo", async () => {
    await deleteUser(
      { userId: "user_1" },
      fakeDb({ id: "user_1" }, [{ photoKey: null }]),
    );

    expect(deleteStorageObjects).not.toHaveBeenCalled();
  });

  it("still deletes the User when the photo cannot be removed", async () => {
    deleteStorageObjects.mockRejectedValue(new Error("Storage unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      deleteUser(
        { userId: "user_1" },
        fakeDb({ id: "user_1" }, [
          { photoKey: "testimonial-photos/request_1/100.png" },
        ]),
      ),
    ).resolves.toMatchObject({ success: true });
  });
});
