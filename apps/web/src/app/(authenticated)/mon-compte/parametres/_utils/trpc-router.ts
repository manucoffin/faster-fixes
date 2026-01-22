import { router } from "@/server/trpc/trpc";
import { changePassword } from "../_features/password/change-password.trpc.mutation";
import { deleteAccount } from "../_features/account-deletion/delete-account.trpc.mutation";
import { getCurrentEmail } from "../_features/email/get-current-email.trpc.query";
import { getProfile } from "../_features/profile/get-profile.trpc.query";
import { updateProfile } from "../_features/profile/update-profile.trpc.mutation";

export const settingsRouter = router({
  changePassword,
  deleteAccount,
  getCurrentEmail,
  getProfile,
  updateProfile,
});
