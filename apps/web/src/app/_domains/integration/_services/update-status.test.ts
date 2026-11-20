import { describe, expect, it } from "vitest";
import { inMemoryStatusConvergence } from "./_in-memory-status-convergence";
import { updateStatus } from "./update-status";

describe("updateStatus", () => {
  it("writes the Status and announces each Feedback changed by a User", async () => {
    const convergence = inMemoryStatusConvergence({ a: "new", b: "resolved" });

    await expect(
      updateStatus(
        { feedbackIds: ["a", "b"], status: "in_progress", actor: "user" },
        convergence,
      ),
    ).resolves.toEqual(["a", "b"]);

    expect(Object.fromEntries(convergence.statuses)).toEqual({
      a: "in_progress",
      b: "in_progress",
    });
    expect(convergence.events).toEqual([
      { feedbackId: "a", newStatus: "in_progress", actor: "user" },
      { feedbackId: "b", newStatus: "in_progress", actor: "user" },
    ]);
  });

  it("still announces a User re-setting the Status a Feedback already has", async () => {
    const convergence = inMemoryStatusConvergence({ a: "resolved" });

    await expect(
      updateStatus(
        { feedbackIds: ["a"], status: "resolved", actor: "user" },
        convergence,
      ),
    ).resolves.toEqual(["a"]);

    expect(convergence.events).toEqual([
      { feedbackId: "a", newStatus: "resolved", actor: "user" },
    ]);
  });

  it("writes nothing and announces nothing when the Agent sets the Status a Feedback already has", async () => {
    const convergence = inMemoryStatusConvergence({ a: "resolved", b: "new" });

    await expect(
      updateStatus(
        { feedbackIds: ["a", "b"], status: "resolved", actor: "agent" },
        convergence,
      ),
    ).resolves.toEqual(["b"]);

    expect(convergence.events).toEqual([
      { feedbackId: "b", newStatus: "resolved", actor: "agent" },
    ]);
  });

  it("names the Tracker as origin of a change it drove", async () => {
    const convergence = inMemoryStatusConvergence({ a: "new", b: "resolved" });

    await updateStatus(
      { feedbackIds: ["a", "b"], status: "resolved", actor: "jira" },
      convergence,
    );

    expect(convergence.statuses.get("a")).toBe("resolved");
    expect(convergence.events).toEqual([
      {
        feedbackId: "a",
        newStatus: "resolved",
        origin: "jira",
        actor: "tracker",
      },
    ]);
  });

  it("leaves a Feedback no longer in the guarded Status untouched", async () => {
    const convergence = inMemoryStatusConvergence({
      archived: "closed",
      movedOn: "in_progress",
    });

    await expect(
      updateStatus(
        {
          feedbackIds: ["archived", "movedOn"],
          status: "new",
          onlyFrom: "closed",
          actor: "user",
        },
        convergence,
      ),
    ).resolves.toEqual(["archived"]);

    expect(Object.fromEntries(convergence.statuses)).toEqual({
      archived: "new",
      movedOn: "in_progress",
    });
    expect(convergence.events).toEqual([
      { feedbackId: "archived", newStatus: "new", actor: "user" },
    ]);
  });

  it("announces nothing when no Feedback is written", async () => {
    const convergence = inMemoryStatusConvergence();

    await expect(
      updateStatus(
        { feedbackIds: ["missing"], status: "new", actor: "user" },
        convergence,
      ),
    ).resolves.toEqual([]);
    expect(convergence.events).toEqual([]);
  });
});
