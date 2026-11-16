import { checkFeatureAccess } from "@/server/auth/subscription";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { getTrelloAccess } from "./get-trello-access";
import { TrelloListMappingSchema } from "./trello-list-mapping.schema";
import type { UpdateProjectTrelloLinkInput } from "./update-project-trello-link.schema";

export async function updateProjectTrelloLink(
  {
    projectId,
    lists,
    defaultLabelIds,
    autoCreateIssues,
    userId,
  }: UpdateProjectTrelloLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId } = await getTrelloAccess(
    {
      userId,
      projectId,
      requireAdmin: true,
      adminDeniedMessage:
        "Only owners and admins can change Trello link settings.",
    },
    db,
  );

  // Enforced here rather than by the tRPC middleware so the gate holds for
  // every transport that updates a link.
  const featureAccess = await checkFeatureAccess(
    organizationId,
    "trelloIntegration",
    db,
  );

  if (!featureAccess.allowed) {
    throw new ForbiddenError(
      "Trello integration is available on paid plans. Upgrade your plan to change this Trello board link.",
    );
  }

  const mapping =
    lists === undefined ? undefined : TrelloListMappingSchema.safeParse(lists);

  if (mapping && !mapping.success) {
    throw new BadRequestError(
      mapping.error.issues[0]?.message ?? "Invalid list mapping.",
    );
  }

  const link = await db.projectTrelloLink.findUnique({
    where: { projectId },
    select: { id: true },
  });

  if (!link) {
    throw new NotFoundError("This project is not linked to a Trello board.");
  }

  await db.projectTrelloLink.update({
    where: { id: link.id },
    data: {
      ...(mapping && {
        newListId: mapping.data.newListId,
        inProgressListId: mapping.data.inProgressListId,
        resolvedListId: mapping.data.resolvedListId,
      }),
      ...(defaultLabelIds !== undefined && { defaultLabelIds }),
      ...(autoCreateIssues !== undefined && { autoCreateIssues }),
    },
  });

  return { success: true };
}
