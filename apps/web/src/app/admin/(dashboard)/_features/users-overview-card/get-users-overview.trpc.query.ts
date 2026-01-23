import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { prisma } from "@workspace/db";

export const getUsersOverview = adminProcedure.query(async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCount, newUsersThisMonth] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: now,
        },
      },
    }),
  ]);

  return {
    totalCount,
    newUsersThisMonth,
  };
});

export type GetUsersOverviewOutput = inferProcedureOutput<
  typeof getUsersOverview
>;
