import { prisma } from "@workspace/db";

/** The Organization roles allowed to connect an Integration. */
const INSTALLING_ROLES = ["owner", "admin"] as const;

/**
 * The Member record of the caller when they may connect an Integration for the
 * Organization, `null` when they may not. It sits at the bucket root rather
 * than under a provider: GitHub, Linear, Jira and Slack all ask this same
 * question, and the Member returned is what an Installation records as its
 * installer.
 */
export async function findInstallingMember({
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
      role: { in: [...INSTALLING_ROLES] },
    },
  });
}

export type FindInstallingMemberOutput = Awaited<
  ReturnType<typeof findInstallingMember>
>;
