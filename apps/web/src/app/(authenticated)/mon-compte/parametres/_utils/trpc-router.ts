import { router } from "@/server/trpc/trpc";
import { getProfile } from "../_features/profile/get-profile.trpc.query";
import { updateProfile } from "../_features/profile/update-profile.trpc.mutation";

export const settingsRouter = router({
  getProfile,
  updateProfile,
});
