import { NonRetriableError } from "inngest";
import { describe, expect, it } from "vitest";
import { NotFoundError, PreconditionFailedError } from "./domain-errors";
import { rethrowDomainErrorsAsNonRetriable } from "./non-retriable";

class JiraReauthRequiredLookalike extends PreconditionFailedError {
  constructor() {
    super("The Jira connection needs to be re-authorized.");
    this.name = "JiraReauthRequiredLookalike";
  }
}

describe("rethrowDomainErrorsAsNonRetriable", () => {
  it("turns a domain error into a NonRetriableError keeping the message", () => {
    const domainError = new NotFoundError("Feedback not found");

    try {
      rethrowDomainErrorsAsNonRetriable(domainError);
      expect.unreachable("the helper always throws");
    } catch (error) {
      expect(error).toBeInstanceOf(NonRetriableError);
      expect((error as NonRetriableError).message).toBe("Feedback not found");
      expect((error as NonRetriableError).cause).toBe(domainError);
    }
  });

  it("recognizes a second-level subclass of the vocabulary", () => {
    expect(() =>
      rethrowDomainErrorsAsNonRetriable(new JiraReauthRequiredLookalike()),
    ).toThrow(NonRetriableError);
  });

  it("rethrows an infrastructure error untouched, so it keeps its retries", () => {
    const infrastructureError = new Error("Atlassian answered 503");

    try {
      rethrowDomainErrorsAsNonRetriable(infrastructureError);
      expect.unreachable("the helper always throws");
    } catch (error) {
      expect(error).toBe(infrastructureError);
      expect(error).not.toBeInstanceOf(NonRetriableError);
    }
  });

  it("rethrows a thrown non-error value as it is", () => {
    expect(() =>
      rethrowDomainErrorsAsNonRetriable("not even an error"),
    ).toThrow("not even an error");
  });
});
