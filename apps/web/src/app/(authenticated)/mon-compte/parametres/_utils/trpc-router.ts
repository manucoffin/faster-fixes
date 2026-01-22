import { router } from "@/server/trpc/trpc";
import { getCurrentEmail } from "../_features/email/get-current-email.trpc.query";
import { getProfile } from "../_features/profile/get-profile.trpc.query";
import { updateProfile } from "../_features/profile/update-profile.trpc.mutation";

export const settingsRouter = router({
  getCurrentEmail,
  getProfile,
  updateProfile,
});
