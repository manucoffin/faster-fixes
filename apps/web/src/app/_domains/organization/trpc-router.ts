import { protectedProcedure, router } from "@/server/trpc/trpc";
import { createOrganization } from "./_services/create-organization";
import { CreateOrganizationSchema } from "./_services/create-organization.schema";

export const organizationRouter = router({
  create: protectedProcedure
    .input(CreateOrganizationSchema)
    .mutation(({ input, ctx }) =>
      createOrganization({ name: input.name, ownerId: ctx.session.user.id }),
    ),
});
