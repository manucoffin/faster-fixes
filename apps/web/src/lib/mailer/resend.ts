import "server-only";

import { Resend } from "resend";

import { isDevelopment } from "@/utils/environment/env";

import type {
  AddContactToSegmentOptions,
  Contact,
  CreateContactOptions,
  EmailResponse,
  Mailer,
  MailOptions,
  UpdateContactOptions,
} from "./types";
import { EmailError } from "./types";

const DEV_TEST_EMAIL = "delivered@resend.dev";

export class ResendMailer implements Mailer {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  public emails = {
    send: async (options: MailOptions): Promise<EmailResponse> => {
      const to = isDevelopment() ? DEV_TEST_EMAIL : options.to;

      const attachments = options.attachments?.map((attachment) => ({
        filename: attachment.name,
        content: attachment.content,
        contentType: attachment.type,
      }));

      let result;
      if (options.templateId) {
        result = await this.client.emails.send({
          to,
          template: {
            id: String(options.templateId),
            ...(options.params && { variables: options.params }),
          },
          ...(options.from && { from: options.from }),
          ...(options.subject && { subject: options.subject }),
          ...(attachments && { attachments }),
        });
      } else if (options.body) {
        result = await this.client.emails.send({
          from: options.from,
          to,
          subject: options.subject,
          html: options.body,
          ...(attachments && { attachments }),
        });
      } else {
        throw new EmailError(
          "Email body or templateId is required",
          "MISSING_BODY",
        );
      }

      const { data, error } = result;
      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return {
        success: true,
        message: "Email sent successfully",
        data,
      };
    },
  };

  public contacts = {
    list: async (): Promise<Contact[]> => {
      const { data, error } = await this.client.contacts.list();

      if (error) {
        throw new EmailError(error.message, error.name);
      }

      return data.data.map(mapResendContact);
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
        id: data.id,
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

      return mapResendContact(data);
    },

    update: async (options: UpdateContactOptions): Promise<Contact> => {
      const identifier = getContactIdentifier(options);

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
      return this.contacts.get(data.id);
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

    addToSegment: async (
      options: AddContactToSegmentOptions,
    ): Promise<void> => {
      const identifier = getContactIdentifier(options);

      const { error } = await this.client.contacts.segments.add({
        ...("id" in identifier ? { contactId: identifier.id } : identifier),
        segmentId: options.segmentId,
      });

      if (error) {
        throw new EmailError(error.message, error.name);
      }
    },
  };
}

function getContactIdentifier(options: {
  id?: string;
  email?: string;
}): { id: string } | { email: string } {
  if (options.id) {
    return { id: options.id };
  }
  if (options.email) {
    return { email: options.email };
  }
  throw new EmailError(
    "Either id or email must be provided",
    "MISSING_IDENTIFIER",
  );
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
