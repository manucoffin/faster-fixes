export type EmailResponse = {
  success: boolean;
  message: string;
  data?: object; // optional field for any additional provider-specific info
};

export class EmailError extends Error {
  public code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "EmailError";
    this.code = code;
  }
}

export type EmailAttachment = {
  name: string;
  content: string; // Base64 encoded content
  type?: string; // MIME type
};

export type MailOptions = {
  from: string;
  to: string;
  subject: string;
  body?: string; // Plain text, either via react-email render function or raw HTML
  templateId?: number | string;
  params?: Record<string, string>;
  attachments?: EmailAttachment[];
};

export type Contact = {
  id: string;
  email: string;
  subscribed: boolean;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateContactOptions = {
  email: string;
  subscribed: boolean;
  data?: Record<string, unknown>;
};

export type UpdateContactOptions = {
  id?: string;
  email?: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
};

export interface Mailer {
  emails: {
    send(options: MailOptions): Promise<EmailResponse>;
  };
  contacts: {
    list(): Promise<Contact[]>;
    create(options: CreateContactOptions): Promise<Contact>;
    get(id: string): Promise<Contact>;
    update(options: UpdateContactOptions): Promise<Contact>;
    delete(id: string): Promise<Contact>;
  };
}
