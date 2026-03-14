import { router } from "@/server/trpc/trpc";
import { getOrganizationDetails } from "../_features/general/get-organization-details.trpc.query";

export const organisationRouter = router({
  getOrganizationDetails,
});
