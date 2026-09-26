import { prisma } from "@workspace/db";

export async function listReceivedInvitations({ email }: { email: string }) {
  return prisma.invitation.findMany({
    where: {
      email,
      status: "pending",
    },
    include: {
      organization: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type ListReceivedInvitationsOutput = Awaited<
  ReturnType<typeof listReceivedInvitations>
>;
