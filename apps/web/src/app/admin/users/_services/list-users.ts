import { prisma } from "@workspace/db";
import type { Prisma } from "@workspace/db/types";
import type { ListUsersInput } from "./list-users.schema";

// Shape returned for each row; kept in one place so both the default and the
// feedback-count sort path hydrate users identically.
const userSelect = {
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
          id: true,
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
} satisfies Prisma.UserSelect;

type HydratedUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const defaultOrgId = (user: HydratedUser) =>
  user.members[0]?.organization.id ?? null;

// Feedback "per user" = submissions collected across the user's default-org
// projects. There's no direct user→feedback FK, so counts are aggregated per
// organization (one query) and mapped back onto users.
async function feedbackCountByOrg(orgIds: Array<string | null>) {
  const ids = orgIds.filter((id): id is string => id !== null);
  if (ids.length === 0) return new Map<string, number>();

  const projects = await prisma.project.findMany({
    where: { organizationId: { in: ids } },
    select: { organizationId: true, _count: { select: { feedback: true } } },
  });

  const counts = new Map<string, number>();
  for (const project of projects) {
    counts.set(
      project.organizationId,
      (counts.get(project.organizationId) ?? 0) + project._count.feedback,
    );
  }
  return counts;
}

async function withFeedbackCount(users: HydratedUser[]) {
  const counts = await feedbackCountByOrg(users.map(defaultOrgId));
  return users.map((user) => {
    const orgId = defaultOrgId(user);
    return {
      ...user,
      feedbackCount: orgId ? (counts.get(orgId) ?? 0) : 0,
    };
  });
}

export async function listUsers({
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
}: ListUsersInput) {
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

  // Prisma can't orderBy a nested aggregate (feedback lives two relations
  // away), so rank all matching users in memory then paginate. Admin scale
  // keeps this cheap.
  if (sortBy === "feedbackCount") {
    const order = sortOrder ?? "desc";
    const matching = await prisma.user.findMany({
      where,
      select: {
        id: true,
        members: {
          where: { organization: { isDefault: true } },
          select: { organizationId: true },
        },
      },
    });

    const counts = await feedbackCountByOrg(
      matching.map((user) => user.members[0]?.organizationId ?? null),
    );

    const rankedIds = matching
      .map((user) => ({
        id: user.id,
        count: counts.get(user.members[0]?.organizationId ?? "") ?? 0,
      }))
      .sort((a, b) => (order === "asc" ? a.count - b.count : b.count - a.count))
      .slice((page - 1) * pageSize, page * pageSize)
      .map((entry) => entry.id);

    const pageUsers = await prisma.user.findMany({
      where: { id: { in: rankedIds } },
      select: userSelect,
    });
    // findMany ignores the `in` order; restore the ranked order.
    const orderedUsers = rankedIds
      .map((id) => pageUsers.find((user) => user.id === id))
      .filter((user): user is HydratedUser => user !== undefined);

    return {
      users: await withFeedbackCount(orderedUsers),
      count: matching.length,
    };
  }

  // Build orderBy clause
  const orderBy =
    sortBy && sortOrder ? { [sortBy]: sortOrder } : { name: "asc" as const };

  const [users, count] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      select: userSelect,
      orderBy,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: await withFeedbackCount(users),
    count,
  };
}

export type ListUsersOutput = Awaited<ReturnType<typeof listUsers>>;
