import { checkFeatureAccess } from "@/server/auth/subscription";
import { prisma } from "@workspace/db";

/**
 * Whether the Plan of the Organization includes the Slack Integration.
 *
 * Plan enforcement itself stays in the server folder, where the transports and
 * the `organization` domain all reach it; this service is the one question the
 * Slack install route asks of it, so that route no longer carries a database
 * client of its own. The denial metadata `checkFeatureAccess` returns is
 * dropped on purpose: the route maps every refusal to the same
 * `?error=upgrade_required` and renders nothing from it.
 */
export async function hasSlackIntegrationAccess(organizationId: string) {
  const featureAccess = await checkFeatureAccess(
    organizationId,
    "slackIntegration",
    prisma,
  );

  return featureAccess.allowed;
}

export type HasSlackIntegrationAccessOutput = Awaited<
  ReturnType<typeof hasSlackIntegrationAccess>
>;
