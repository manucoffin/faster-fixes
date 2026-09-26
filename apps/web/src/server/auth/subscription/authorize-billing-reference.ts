import { prisma } from "@workspace/db";

// Stripe plugin routes are reachable directly under `/api/auth`, so the
// Organization id they receive comes from the client and proves nothing.
export async function authorizeBillingReference(
  {
    userId,
    organizationId,
    action,
  }: { userId: string; organizationId: string; action: string },
  db: typeof prisma = prisma,
): Promise<boolean> {
  const membership = await db.member.findFirst({
    where: { organizationId, userId },
    select: { role: true },
  });

  if (!membership) {
    return false;
  }

  // Any member reads the Subscription; every other action, including an
  // unknown future one, changes billing and stays with the owner.
  return action === "list-subscription" || membership.role === "owner";
}
