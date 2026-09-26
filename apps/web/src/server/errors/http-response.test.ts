import { describe, expect, it } from "vitest";
import type { DomainError } from "./domain-errors";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PreconditionFailedError,
} from "./domain-errors";
import { domainErrorResponse } from "./http-response";

const cases: Array<[string, DomainError, number]> = [
  ["BAD_REQUEST", new BadRequestError("Bad input."), 400],
  ["FORBIDDEN", new ForbiddenError("Access denied."), 403],
  ["NOT_FOUND", new NotFoundError("Project not found"), 404],
  ["CONFLICT", new ConflictError("Already exists."), 409],
  [
    "PRECONDITION_FAILED",
    new PreconditionFailedError("Jira is not connected."),
    412,
  ],
];

describe("domainErrorResponse", () => {
  it.each(cases)(
    "answers a %s with its status, message and code",
    async (code, error, status) => {
      const response = domainErrorResponse(error);

      expect(response?.status).toBe(status);
      await expect(response?.json()).resolves.toEqual({
        error: error.message,
        code,
      });
    },
  );

  it("leaves a non-domain error to the caller's own 500 path", () => {
    expect(domainErrorResponse(new Error("Prisma exploded"))).toBeNull();
    expect(domainErrorResponse("not even an error")).toBeNull();
  });
});
