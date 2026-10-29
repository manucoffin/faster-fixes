import { describe, expect, it } from "vitest";

import { getTestimonialRequestEmail } from "./get-testimonial-request-email";

const params = {
  appUrl: "https://app.example.com",
  token: "tok_123",
  recipientName: "Ada",
  feedbackCount: 42,
  organizationName: "Acme Studio",
};

const formUrl = "https://app.example.com/testimonial/tok_123";
const declineUrl = "https://app.example.com/testimonial/tok_123/decline";

describe("getTestimonialRequestEmail", () => {
  it("writes the first email with the name, count, Organization and both links", async () => {
    const email = await getTestimonialRequestEmail({
      kind: "first",
      ...params,
    });

    expect(email.subject).toBe("a small favor");
    expect(email.body).toContain("Hi Ada,");
    expect(email.body).toContain("42");
    expect(email.body).toContain("reports through Faster");
    expect(email.body).toContain("Acme Studio");
    expect(email.body).toContain(`href="${formUrl}"`);
    expect(email.body).toContain(`href="${declineUrl}"`);
    expect(email.body).toContain("asked again?");
  });

  it("writes the reminder with the name and both links", async () => {
    const email = await getTestimonialRequestEmail({
      kind: "reminder",
      ...params,
    });

    expect(email.subject).toBe("re: a small favor");
    expect(email.body).toContain("Hi Ada,");
    expect(email.body).toContain("A quick follow-up on my note");
    expect(email.body).toContain(`href="${formUrl}"`);
    expect(email.body).toContain(`href="${declineUrl}"`);
  });

  it("greets without a name when the recipient has none", async () => {
    const email = await getTestimonialRequestEmail({
      kind: "first",
      ...params,
      recipientName: undefined,
    });

    expect(email.body).toContain("Hi,");
    expect(email.body).not.toContain("Hi undefined");
  });
});
