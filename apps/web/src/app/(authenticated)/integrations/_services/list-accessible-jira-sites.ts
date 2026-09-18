import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { getAccessibleResources } from "@/server/jira/jira-client";
import { getValidJiraAccessToken } from "@/server/jira/token-access";
import { prisma } from "@workspace/db";

// Backs the multi-site picker. Reads the live accessible-resources with the
// stored token so the choice always reflects the current grant, rather than a
// snapshot taken at callback time.
export async function listAccessibleJiraSites(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can configure Jira.");
  }

  const accessToken = await getValidJiraAccessToken(activeOrganization.id);
  const resources = await getAccessibleResources(accessToken);

  return resources.map((resource) => ({
    cloudId: resource.id,
    url: resource.url,
    name: resource.name,
  }));
}

export type ListAccessibleJiraSitesOutput = Awaited<
  ReturnType<typeof listAccessibleJiraSites>
>;
