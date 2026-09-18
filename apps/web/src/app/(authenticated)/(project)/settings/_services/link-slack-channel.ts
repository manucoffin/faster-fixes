import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { LinkSlackChannelInput } from "./link-slack-channel.schema";

export async function linkSlackChannel(
  {
    projectId,
    channelId,
    channelName,
    userId,
  }: LinkSlackChannelInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Privileged membership in the Project's Organization needs the loaded
  // Project, so the denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only owners and admins can set the Slack channel.",
    );
  }

  const installation = await db.slackInstallation.findUnique({
    where: { organizationId: project.organizationId },
    select: { id: true },
  });

  if (!installation) {
    throw new NotFoundError("No Slack workspace connected.");
  }

  await db.projectSlackLink.upsert({
    where: { projectId },
    create: {
      projectId,
      slackInstallationId: installation.id,
      channelId,
      channelName,
    },
    // Changing the channel revalidates the link: a previously failing binding
    // may now point at a reachable channel, so the stale health failure clears.
    update: {
      channelId,
      channelName,
      linkHealthy: true,
      healthIssue: null,
    },
  });

  return { success: true };
}
