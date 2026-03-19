import { adminProcedure } from "@/server/trpc/trpc"; // Adjust the import path based on your project structure
import { inferProcedureOutput } from "@trpc/server";
import { Prisma } from "@workspace/db/generated/prisma/client";
import { z } from "zod";

export const getPaginatedUsers = adminProcedure
  .input(
    z.object({
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.enum(["name", "email", "createdAt"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { page, pageSize, search, sortBy, sortOrder } = input;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            members: {
              some: {
                organization: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          },
        ],
      }),
    };

    // Build orderBy clause
    const orderBy =
      sortBy && sortOrder
        ? { [sortBy]: sortOrder as "asc" | "desc" }
        : { name: "asc" as const };

    const [users, count] = await Promise.all([
      ctx.prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        select: {
          id: true,
          createdAt: true,
          email: true,
          emailVerified: true,
          name: true,
          role: true,
          members: {
            where: {
              organization: {
                isDefault: true,
              },
            },
            select: {
              organization: {
                select: {
                  name: true,
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
        orderBy,
      }),
      ctx.prisma.user.count({ where }),
    ]);

    return {
      users,
      count,
    };
  });

export type GetPaginatedUsersOutput = inferProcedureOutput<
  typeof getPaginatedUsers
>;
