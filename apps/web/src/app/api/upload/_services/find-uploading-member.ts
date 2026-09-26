import { prisma } from "@workspace/db";

/** The Organization roles allowed to replace the Organization logo. */
const UPLOADING_ROLES = ["owner", "admin"] as const;

/**
 * The Member record of the caller when they may upload an object for the
 * Organization, `null` when they may not. It stays colocated with the upload
 * route, its only consumer: the Integration install routes ask the same
 * question through `findInstallingMember`, and neither is promoted to a domain
 * until a second consumer needs it.
 */
export async function findUploadingMember({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  return prisma.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: [...UPLOADING_ROLES] },
    },
  });
}

export type FindUploadingMemberOutput = Awaited<
  ReturnType<typeof findUploadingMember>
>;
