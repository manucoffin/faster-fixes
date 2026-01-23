import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { prisma } from "@workspace/db";

export const getUsersOverview = adminProcedure.query(async () => {
  const [totalCount, petParentCount, professionalCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { type: UserType.PetParent } }),
    prisma.user.count({ where: { type: UserType.Professional } }),
  ]);

  const calculatePercentage = (count: number) => {
    return totalCount === 0 ? 0 : Math.round((count / totalCount) * 100);
  };

  return {
    totalCount,
    petParentCount,
    petParentPercentage: calculatePercentage(petParentCount),
    professionalCount,
    professionalPercentage: calculatePercentage(professionalCount),
  };
});

export type GetUsersOverviewOutput = inferProcedureOutput<
  typeof getUsersOverview
>;
