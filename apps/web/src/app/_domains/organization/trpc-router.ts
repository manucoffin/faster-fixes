import { checkOrganizationLimit } from "@/server/auth/subscription";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { createOrganization } from "./_services/create-organization";
import { CreateOrganizationSchema } from "./_services/create-organization.schema";

export const organizationRouter = router({
  create: protectedProcedure
    .input(CreateOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, session } = ctx;

      // A plan limit denial is transport policy, not a domain failure, so it
      // stays in the procedure.
      const organizationCheck = await checkOrganizationLimit(
        session.user.id,
        prisma,
      );
      if (!organizationCheck.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached the organizations limit for your plan (${organizationCheck.denial.metadata.current}/${organizationCheck.denial.metadata.limit}). Upgrade to get more.`,
          cause: organizationCheck.denial,
        });
      }

      return createOrganization({ name: input.name, ownerId: session.user.id });
    }),
});
