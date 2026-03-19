import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { prisma } from "@workspace/db/index";
import z from "zod";

export const getAllUsersForExport = adminProcedure
  .input(
    z.object({
      search: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const { search } = input;

    // Build where clause
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
  });

export type GetAllUsersForExportOutput = inferProcedureOutput<
  typeof getAllUsersForExport
>;
