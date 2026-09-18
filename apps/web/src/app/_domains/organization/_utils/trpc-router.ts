import { router } from "@/server/trpc/trpc";
import { createOrganization } from "../create-organization.trpc.mutation";

export const organizationFeatureRouter = router({
  create: createOrganization,
});
