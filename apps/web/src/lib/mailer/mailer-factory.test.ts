import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createMailer } from "./mailer-factory";

const { createTransport } = vi.hoisted(() => ({
  createTransport: vi.fn((_options: SMTPTransport.Options) => ({
    sendMail: vi.fn(),
  })),
}));
vi.mock("nodemailer", () => ({ createTransport }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MAILER_PROVIDER", "smtp");
  for (const key of [
    "RESEND_API_KEY",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_REQUIRE_TLS",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ]) {
    vi.stubEnv(key, undefined);
  }
  vi.stubEnv("SMTP_HOST", "mail.example.com");
});
afterEach(() => vi.unstubAllEnvs());

it("defaults to Resend when no provider is selected", () => {
  vi.stubEnv("MAILER_PROVIDER", undefined);
  expect(createMailer).toThrow("RESEND_API_KEY");
});

it("configures SMTP authentication and requires STARTTLS by default", () => {
  vi.stubEnv("SMTP_USER", "sender@example.com");
  vi.stubEnv("SMTP_PASSWORD", "test-password");
  createMailer();
  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      host: "mail.example.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "sender@example.com", pass: "test-password" },
    }),
  );
});

it("supports implicit TLS and relays without authentication", () => {
  vi.stubEnv("SMTP_PORT", "465");
  createMailer();
  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ port: 465, secure: true }),
  );
  expect(createTransport.mock.lastCall?.[0].auth).toBeUndefined();
});

it("supports explicitly disabling STARTTLS for a local relay", () => {
  vi.stubEnv("SMTP_PORT", "1025");
  vi.stubEnv("SMTP_REQUIRE_TLS", "false");
  createMailer();
  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ port: 1025, secure: false, requireTLS: false }),
  );
});

it("rejects invalid SMTP configuration and unknown providers", () => {
  vi.stubEnv("SMTP_HOST", undefined);
  expect(createMailer).toThrow("SMTP_HOST");
  vi.stubEnv("SMTP_HOST", "mail.example.com");
  for (const port of ["not-a-port", "0", "65536"]) {
    vi.stubEnv("SMTP_PORT", port);
    expect(createMailer).toThrow("SMTP_PORT");
  }
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_USER", "sender@example.com");
  expect(createMailer).toThrow("configured together");
  vi.stubEnv("SMTP_USER", undefined);
  vi.stubEnv("SMTP_PASSWORD", "test-password");
  expect(createMailer).toThrow("configured together");
  vi.stubEnv("MAILER_PROVIDER", "unknown");
  expect(createMailer).toThrow("Unsupported mailer provider");
});
