import { mailer } from "@/lib/mailer/client";
import { NO_REPLY_EMAIL } from "@/lib/mailer/constants";
import { UserFeedback } from "@/lib/mailer/templates/user-feedback";
import { PreconditionFailedError } from "@/server/errors/domain-errors";
import { render } from "@react-email/components";
import { prisma } from "@workspace/db";

export async function sendFeedback(
  {
    message,
    senderName,
    senderEmail,
  }: {
    message: string;
    senderName?: string | null;
    senderEmail?: string | null;
  },
  db: typeof prisma = prisma,
) {
  const adminUsers = await db.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });

  const adminEmails = adminUsers
    .map((u) => u.email)
    .filter(Boolean) as string[];

  // An instance with no administrator cannot receive feedback: that is a
  // precondition on the instance, not a server fault.
  if (adminEmails.length === 0) {
    throw new PreconditionFailedError(
      "No administrator found to receive feedback.",
    );
  }

  const fromEmail = senderEmail ?? "Unknown user";
  const fromName = senderName ?? fromEmail;

  const subject = `Feedback from ${fromName}`;
  const body = await render(
    <UserFeedback
      senderName={fromName}
      senderEmail={fromEmail}
      message={message}
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
}
