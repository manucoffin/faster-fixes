import { mailer } from "@/lib/mailer/client";
import { NO_REPLY_EMAIL } from "@/lib/mailer/constants";
import { UserFeedback } from "@/lib/mailer/templates/user-feedback";
import { protectedProcedure } from "@/server/trpc/trpc";
import { render } from "@react-email/components";
import { TRPCError } from "@trpc/server";
import { SendFeedbackSchema } from "./send-feedback.schema";

export const sendFeedback = protectedProcedure
  .input(SendFeedbackSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const adminUsers = await prisma.user.findMany({
      where: { role: "admin" },
      select: { email: true },
    });

    const adminEmails = adminUsers
      .map((u) => u.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No administrator found to receive feedback.",
      });
    }

    const senderEmail = session.user.email ?? "Unknown user";
    const senderName = session.user.name ?? senderEmail;

    const subject = `Feedback from ${senderName}`;
    const body = await render(
      <UserFeedback
        senderName={senderName}
        senderEmail={senderEmail}
        message={input.message}
      />,
    );

    await Promise.all(
      adminEmails.map((to) =>
        mailer.emails.send({
          from: NO_REPLY_EMAIL,
          to,
          subject,
          body,
        }),
      ),
    );

    return { success: true };
  });
