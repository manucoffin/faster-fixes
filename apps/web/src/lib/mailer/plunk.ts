import "server-only";

import type {
  Contact,
  CreateContactOptions,
  EmailResponse,
  Mailer,
  MailOptions,
  UpdateContactOptions,
} from "./types";
import { EmailError } from "./types";

type PlunkAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

type PlunkEmailResponse = {
  success: boolean;
  emails: Array<{
    contact: {
      id: string;
      email: string;
    };
    email: string;
  }>;
  timestamp: string;
};

type PlunkContactResponse = {
  id: string;
  email: string;
  subscribed: boolean;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export class PlunkMailer implements Mailer {
  private apiKey: string;
  private baseUrl = "https://next-api.useplunk.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public emails = {
    send: async (options: MailOptions): Promise<EmailResponse> => {
      // Plunk requires body to be provided
      if (!options.body && !options.templateId) {
        throw new EmailError(
          "Email body or templateId is required",
          "MISSING_BODY",
        );
      }

      // Validate attachments count (max 5)
      if (options.attachments && options.attachments.length > 5) {
        throw new EmailError(
          "Maximum 5 attachments allowed",
          "TOO_MANY_ATTACHMENTS",
        );
      }

      const attachments: PlunkAttachment[] | undefined =
        options.attachments?.map((attachment) => ({
          filename: attachment.name,
          content: attachment.content,
          contentType: attachment.type,
        }));

      const payload = {
        to: options.to,
        subject: options.subject,
        body: options.body,
        ...(options.templateId && { template: options.templateId }),
        ...(options.from && { from: options.from }),
        ...(attachments && { attachments }),
      };

      try {
        const response = await fetch(`${this.baseUrl}/v1/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorData: Record<string, unknown> = {};
          try {
            errorData = (await response.json()) as Record<string, unknown>;
          } catch {
            // Failed to parse error response
          }
          const errorMessage =
            (typeof errorData.message === "string"
              ? errorData.message
              : null) || `HTTP ${response.status}: ${response.statusText}`;
          throw new EmailError(
            errorMessage,
            typeof errorData.code === "string"
              ? errorData.code
              : String(response.status),
          );
        }

        const data = (await response.json()) as PlunkEmailResponse;

        return {
          success: true,
          message: "Email sent successfully",
          data,
        };
      } catch (error) {
        if (error instanceof EmailError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Failed to send email";
        const code =
          error instanceof Error && "code" in error
            ? (error.code as string)
            : undefined;
        throw new EmailError(message, code);
      }
    },
  };

  public contacts = {
    list: async (): Promise<Contact[]> => {
      try {
        const response = await fetch(`${this.baseUrl}/v1/contacts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new EmailError(
            `Failed to list contacts: HTTP ${response.status}`,
            String(response.status),
          );
        }

        const contacts = (await response.json()) as PlunkContactResponse[];
        return contacts;
      } catch (error) {
        if (error instanceof EmailError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Failed to list contacts";
        throw new EmailError(message);
      }
    },

    create: async (options: CreateContactOptions): Promise<Contact> => {
      try {
        const payload = {
          email: options.email,
          subscribed: options.subscribed,
          ...(options.data && { data: options.data }),
        };

        const response = await fetch(`${this.baseUrl}/v1/contacts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorData: Record<string, unknown> = {};
          try {
            errorData = (await response.json()) as Record<string, unknown>;
          } catch {
            // Failed to parse error response
          }
          const errorMessage =
            (typeof errorData.message === "string"
              ? errorData.message
              : null) || `HTTP ${response.status}: ${response.statusText}`;
          throw new EmailError(
            errorMessage,
            typeof errorData.code === "string"
              ? errorData.code
              : String(response.status),
          );
        }

        const contact = (await response.json()) as PlunkContactResponse;
        return contact;
      } catch (error) {
        if (error instanceof EmailError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Failed to create contact";
        throw new EmailError(message);
      }
    },

    get: async (id: string): Promise<Contact> => {
      try {
        const response = await fetch(`${this.baseUrl}/v1/contacts/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new EmailError(
            `Failed to get contact: HTTP ${response.status}`,
            String(response.status),
          );
        }

        const contact = (await response.json()) as PlunkContactResponse;
        return contact;
      } catch (error) {
        if (error instanceof EmailError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Failed to get contact";
        throw new EmailError(message);
      }
    },

    update: async (options: UpdateContactOptions): Promise<Contact> => {
      if (!options.id && !options.email) {
        throw new EmailError(
          "Either id or email must be provided",
          "MISSING_IDENTIFIER",
        );
      }

      try {
        const payload = {
          ...(options.id && { id: options.id }),
          ...(options.email && { email: options.email }),
          ...(options.subscribed !== undefined && {
            subscribed: options.subscribed,
          }),
          ...(options.data && { data: options.data }),
        };

        const response = await fetch(`${this.baseUrl}/v1/contacts`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorData: Record<string, unknown> = {};
          try {
            errorData = (await response.json()) as Record<string, unknown>;
          } catch {
            // Failed to parse error response
          }
          const errorMessage =
            (typeof errorData.message === "string"
              ? errorData.message
              : null) || `HTTP ${response.status}: ${response.statusText}`;
          throw new EmailError(
            errorMessage,
            typeof errorData.code === "string"
              ? errorData.code
              : String(response.status),
          );
        }

        const contact = (await response.json()) as PlunkContactResponse;
        return contact;
      } catch (error) {
        if (error instanceof EmailError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Failed to update contact";
        throw new EmailError(message);
      }
    },

    delete: async (id: string): Promise<Contact> => {
      try {
        const payload = { id };

        const response = await fetch(`${this.baseUrl}/v1/contacts`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorData: Record<string, unknown> = {};
          try {
            errorData = (await response.json()) as Record<string, unknown>;
          } catch {
            // Failed to parse error response
          }
          const errorMessage =
            (typeof errorData.message === "string"
              ? errorData.message
              : null) || `HTTP ${response.status}: ${response.statusText}`;
          throw new EmailError(
            errorMessage,
            typeof errorData.code === "string"
              ? errorData.code
              : String(response.status),
          );
        }

        const contact = (await response.json()) as PlunkContactResponse;
        return contact;
      } catch (error) {
        if (error instanceof EmailError) {
          throw error;
        }
        const message =
          error instanceof Error ? error.message : "Failed to delete contact";
        throw new EmailError(message);
      }
    },

    // Plunk has no segment equivalent: contacts are targeted through triggers
    // and campaigns instead. Fail loudly rather than silently dropping the call
    // if the mailer provider is ever switched back to Plunk.
    addToSegment: async (): Promise<void> => {
      throw new EmailError(
        "Plunk does not support segments",
        "UNSUPPORTED_OPERATION",
      );
    },
  };
}
