import { prisma } from "@workspace/db";
import type { ListUsersForExportInput } from "./list-users-for-export.schema";

export async function listUsersForExport({ search }: ListUsersForExportInput) {
  const where = {
    ...(search && {
      name: {
        contains: search,
        mode: "insensitive" as const,
      },
    }),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      role: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      members: {
        where: {
          organization: {
            isDefault: true,
          },
        },
        select: {
          organization: {
            select: {
              subscription: {
                select: {
                  plan: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => ({
    firstName: user.profile?.firstName || "",
    lastName: user.profile?.lastName || "",
    email: user.email || "",
  }));
}

export type ListUsersForExportOutput = Awaited<
  ReturnType<typeof listUsersForExport>
>;
