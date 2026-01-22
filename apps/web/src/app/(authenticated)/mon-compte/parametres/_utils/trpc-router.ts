import { router } from "@/server/trpc/trpc";
import { updateProfile } from "../_features/profile/update-profile.mutation";

export const settingsRouter = router({
  updateProfile,
});
