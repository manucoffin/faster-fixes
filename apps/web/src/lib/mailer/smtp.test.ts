import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { expect, it, vi } from "vitest";
import { SmtpMailer } from "./smtp";

const options = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Verification",
  body: "<p>Verify your email</p>",
};
const reply: SMTPTransport.SentMessageInfo = {
  accepted: [options.to],
  rejected: [],
  pending: [],
  messageId: "message-id",
  envelope: { from: options.from, to: [options.to] },
  response: "250 OK",
  envelopeTime: 0,
  messageTime: 0,
  messageSize: 0,
};

function createTransport() {
  return { sendMail: vi.fn(async () => reply) };
}

it("sends rendered HTML and decodes attachments", async () => {
  const transport = createTransport();
  const mailer = new SmtpMailer(transport);
  expect(
    await mailer.emails.send({
      ...options,
      attachments: [
        { name: "note.txt", content: "aGVsbG8=", type: "text/plain" },
      ],
    }),
  ).toMatchObject({ success: true, data: { messageId: reply.messageId } });
  expect(transport.sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.body,
      attachments: [
        {
          filename: "note.txt",
          content: Buffer.from("hello"),
          contentType: "text/plain",
        },
      ],
    }),
  );
});

it("rejects missing bodies and provider-specific templates", async () => {
  const transport = createTransport();
  const mailer = new SmtpMailer(transport);
  for (const invalid of [{ body: undefined }, { templateId: "template" }]) {
    await expect(
      mailer.emails.send({ ...options, ...invalid }),
    ).rejects.toMatchObject({ code: "MISSING_BODY" });
  }
  expect(transport.sendMail).not.toHaveBeenCalled();
});

it("rejects empty acceptance and partial recipient refusals", async () => {
  const transport = createTransport();
  const mailer = new SmtpMailer(transport);
  for (const outcome of [
    { accepted: [], rejected: [] },
    { accepted: [options.to], rejected: ["other@example.com"] },
  ]) {
    transport.sendMail.mockResolvedValueOnce({ ...reply, ...outcome });
    await expect(
      mailer.emails.send({
        ...options,
        to: `${options.to}, other@example.com`,
      }),
    ).rejects.toMatchObject({ code: "REJECTED" });
  }
});
