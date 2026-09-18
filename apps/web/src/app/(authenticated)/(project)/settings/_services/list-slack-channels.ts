import { auth } from "@/server/auth";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { decryptSlackToken } from "@/server/slack/crypto";
import { listPublicChannels } from "@/server/slack/slack-client";
import { prisma } from "@workspace/db";

export async function listSlackChannels(
  { userId, headers }: { userId: string; headers: Headers },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // The privileged-membership denial needs the resolved Organization, so it
  // lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can list Slack channels.");
  }

  const installation = await db.slackInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    select: { botToken: true },
  });

  if (!installation) {
    throw new NotFoundError("No Slack workspace connected.");
  }

  const botToken = decryptSlackToken(installation.botToken);
  return listPublicChannels(botToken);
}

export type ListSlackChannelsOutput = Awaited<
  ReturnType<typeof listSlackChannels>
>;
