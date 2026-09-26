import { resolveOrganizationPlan } from "@/server/auth/subscription";
import { prisma } from "@workspace/db";

type GetWidgetConfigInput = {
  organizationId: string;
  /** The Project's widget config, as the Project resolution includes it. */
  widgetConfig: { enabled: boolean } | null;
};

/**
 * What an embedding page needs to render the widget: whether the Project left
 * it on, and whether its Plan still carries the Faster Fixes branding. A
 * Project with no widget config row counts as enabled, so a widget installed
 * before the setting existed keeps working.
 */
export async function getWidgetConfig({
  organizationId,
  widgetConfig,
}: GetWidgetConfigInput) {
  const plan = await resolveOrganizationPlan(organizationId, prisma);

  return {
    enabled: widgetConfig?.enabled ?? true,
    branding: !plan.limits.whiteLabel,
  };
}

export type GetWidgetConfigOutput = Awaited<ReturnType<typeof getWidgetConfig>>;
