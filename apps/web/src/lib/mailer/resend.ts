import "server-only";

import { Resend } from "resend";

import { isDevelopment } from "@/utils/environment/env";

import {
  Contact,
  CreateContactOptions,
  EmailError,
  EmailResponse,
  Mailer,
  MailOptions,
  UpdateContactOptions,
} from "./types";

const DEV_TEST_EMAIL = "delivered@resend.dev";

export class ResendMailer implements Mailer {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  public emails = {
    send: async (options: MailOptions): Promise<EmailResponse> => {
      if (!options.body && !options.templateId) {
        throw new EmailError(
          "Email body or templateId is required",
          "MISSING_BODY"
        );
      }

      const to = isDevelopment() ? DEV_TEST_EMAIL : options.to;

      const attachments = options.attachments?.map((attachment) => ({
        filename: attachment.name,
        content: attachment.content,
        contentType: attachment.type,
      }));

      const { data, error } = options.templateId
        ? await this.client.emails.send({
            to,
            template: {
              id: String(options.templateId),
              ...(options.params && { variables: options.params }),
            },
            ...(options.from && { from: options.from }),
            ...(options.subject && { subject: options.subject }),
            ...(attachments && { attachments }),
          })
        : await this.client.emails.send({
            from: options.from,
            to,
            subject: options.subject,
            html: options.body!,
            ...(attachments && { attachments }),
          });

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return {
        success: true,
        message: "Email sent successfully",
        data: data ?? undefined,
      };
    },
  };

  public contacts = {
    list: async (): Promise<Contact[]> => {
      const { data, error } = await this.client.contacts.list();

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return (data?.data ?? []).map(mapResendContact);
    },

    create: async (options: CreateContactOptions): Promise<Contact> => {
      const { data, error } = await this.client.contacts.create({
        email: options.email,
        unsubscribed: !options.subscribed,
      });

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return {
        id: data!.id,
        email: options.email,
        subscribed: options.subscribed,
        data: options.data ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },

    get: async (id: string): Promise<Contact> => {
      const { data, error } = await this.client.contacts.get({ id });

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return mapResendContact(data!);
    },

    update: async (options: UpdateContactOptions): Promise<Contact> => {
      if (!options.id && !options.email) {
        throw new EmailError(
          "Either id or email must be provided",
          "MISSING_IDENTIFIER"
        );
      }

      const identifier = options.id
        ? ({ id: options.id } as const)
        : ({ email: options.email! } as const);

      const { data, error } = await this.client.contacts.update({
        ...identifier,
        ...(options.subscribed !== undefined && {
          unsubscribed: !options.subscribed,
        }),
      });

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      // Resend update returns minimal data, fetch the full contact
      const contactId = data?.id ?? options.id;
      if (contactId) {
        return this.contacts.get(contactId);
      }

      return {
        id: data?.id ?? "",
        email: options.email ?? "",
        subscribed: options.subscribed ?? true,
        data: options.data ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },

    delete: async (id: string): Promise<Contact> => {
      // Fetch contact before deleting so we can return it
      const contact = await this.contacts.get(id);

      const { error } = await this.client.contacts.remove({ id });

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return contact;
    },
  };
}

function mapResendContact(contact: {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  unsubscribed: boolean;
  created_at: string;
}): Contact {
  return {
    id: contact.id,
    email: contact.email,
    subscribed: !contact.unsubscribed,
    data: {
      ...(contact.first_name && { firstName: contact.first_name }),
      ...(contact.last_name && { lastName: contact.last_name }),
    },
    createdAt: contact.created_at,
    updatedAt: contact.created_at,
  };
}
