import { prisma } from "@workspace/db";

export async function getUsersOverview() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalCount, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: now,
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: monthStart,
        },
      },
    }),
  ]);

  // Growth is undefined when last month had no signups: a percentage change
  // from zero is mathematically undefined, so the UI shows a neutral state.
  const monthOverMonthGrowth =
    newUsersLastMonth === 0
      ? null
      : ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100;

  return {
    totalCount,
    newUsersThisMonth,
    newUsersLastMonth,
    monthOverMonthGrowth,
  };
}

export type GetUsersOverviewOutput = Awaited<
  ReturnType<typeof getUsersOverview>
>;
