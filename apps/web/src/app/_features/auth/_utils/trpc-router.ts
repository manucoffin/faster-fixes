import { router } from "@/server/trpc/trpc";
import { sendVerificationEmail } from "../send-verification-email-button/send-verification-email.trpc.mutation";
import { stopImpersonate } from "../stop-impersonate-button/stop-impersonate.trpc.mutation";

export const authenticationFeatureRouter = router({
  sendVerificationEmail: sendVerificationEmail,
  stopImpersonate: stopImpersonate,
});
