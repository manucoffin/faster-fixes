import {
  PLAN_LIMITS,
  type PlanLimits,
  SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";
import { resolveOrganizationPlan } from "@/server/auth/subscription";
import { prisma } from "@workspace/db";
import { customSession } from "better-auth/plugins";

export const customSessionPlugin = customSession(async ({ user, session }) => {
  // Get the current session record from the database to access impersonatedBy
  const currentSessionRecord = await prisma.session.findUnique({
    where: {
      id: session.id,
    },
    select: {
      impersonatedBy: true,
      activeOrganizationId: true,
    },
  });

  const userData = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
    select: {
      role: true,
      onboardingCompleted: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  let activePlanName: string = SubscriptionPlanName.Free;
  let activePlanLimits: PlanLimits = PLAN_LIMITS[SubscriptionPlanName.Free];

  if (currentSessionRecord?.activeOrganizationId) {
    const plan = await resolveOrganizationPlan(
      currentSessionRecord.activeOrganizationId,
      prisma,
    );
    activePlanName = plan.planName;
    activePlanLimits = plan.limits;
  }

  return {
    user: {
      ...user,
      firstName: userData?.profile?.firstName,
      lastName: userData?.profile?.lastName,
      role: userData?.role || "user",
      onboardingCompleted: userData?.onboardingCompleted,
    },
    session: {
      ...session,
      impersonatedBy: currentSessionRecord?.impersonatedBy,
      activeOrganizationId: currentSessionRecord?.activeOrganizationId ?? null,
      activePlanName,
      activePlanLimits,
    },
  };
});
