import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";

export const handleLinearOAuthRevoked = inngest.createFunction(
  {
    id: "handle-linear-oauth-revoked",
    retries: 2,
    triggers: [{ event: "linear/oauth.revoked" }],
  },
  async ({ event }) => {
    const { installationId } = event.data as { installationId: string };
    if (!installationId) return { skipped: "no_installation_id" };

    await prisma.linearInstallation.deleteMany({
      where: { id: installationId },
    });

    return { deletedInstallation: installationId };
  },
);
