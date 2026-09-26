import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { linearOAuthRevokedEvent } from "@/server/inngest/events";

export const handleLinearOAuthRevoked = inngest.createFunction(
  {
    id: "handle-linear-oauth-revoked",
    retries: 2,
    triggers: [{ event: linearOAuthRevokedEvent }],
  },
  async ({ event }) => {
    const { installationId } = event.data;
    if (!installationId) return { skipped: "no_installation_id" };

    await prisma.linearInstallation.deleteMany({
      where: { id: installationId },
    });

    return { deletedInstallation: installationId };
  },
);
