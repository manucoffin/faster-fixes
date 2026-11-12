import { describe, expect, it } from "vitest";
import {
  findFeedbackWithAwaitedRecording,
  RECORDING_WAIT_TIMEOUT_MS,
} from "./find-feedback-with-awaited-recording";

type Feedback = { id: string; recording: { key: string } | null };

const FEEDBACK_ID = "feedback_1";
const withoutRecording: Feedback = { id: FEEDBACK_ID, recording: null };
const withRecording: Feedback = {
  id: FEEDBACK_ID,
  recording: { key: "feedback-recordings/project_1/r.gz" },
};

const createdEvent = {
  name: "feedback/created",
  data: { feedbackId: FEEDBACK_ID, recordingFollows: true as const },
};
const attachedEvent = {
  name: "feedback/recording-attached",
  data: { feedbackId: FEEDBACK_ID },
  id: "event_1",
  ts: 0,
};

/** Answers the wait with `result` and records what it was asked for. */
function fakeStep(result: typeof attachedEvent | null) {
  const waits: { id: string; opts: { timeout: number; if: string } }[] = [];
  return {
    waits,
    waitForEvent: (id: string, opts: { timeout: number; if: string }) => {
      waits.push({ id, opts });
      return Promise.resolve(result);
    },
  };
}

/** Holds the stored Feedback and counts the reads. */
function fakeDatabase(stored: Feedback | null) {
  const db = {
    reads: 0,
    readFeedback: () => {
      db.reads += 1;
      return Promise.resolve(stored);
    },
  };
  return db;
}

describe("findFeedbackWithAwaitedRecording", () => {
  it("does not wait for an Issue created by hand", async () => {
    const step = fakeStep(null);
    const db = fakeDatabase(withRecording);

    const feedback = await findFeedbackWithAwaitedRecording({
      event: {
        name: "feedback/integration-issue-requested",
        data: { feedbackId: FEEDBACK_ID },
      },
      step,
      feedback: withoutRecording,
      readFeedback: db.readFeedback,
    });

    expect(feedback).toBe(withoutRecording);
    expect(step.waits).toEqual([]);
    expect(db.reads).toBe(0);
  });

  it("does not wait for a Feedback that declares no Recording", async () => {
    const step = fakeStep(null);
    const db = fakeDatabase(withRecording);

    const feedback = await findFeedbackWithAwaitedRecording({
      event: { name: "feedback/created", data: { feedbackId: FEEDBACK_ID } },
      step,
      feedback: withoutRecording,
      readFeedback: db.readFeedback,
    });

    expect(feedback).toBe(withoutRecording);
    expect(step.waits).toEqual([]);
    expect(db.reads).toBe(0);
  });

  it("does not wait when the Recording is already stored", async () => {
    const step = fakeStep(null);
    const db = fakeDatabase(withRecording);

    const feedback = await findFeedbackWithAwaitedRecording({
      event: createdEvent,
      step,
      feedback: withRecording,
      readFeedback: db.readFeedback,
    });

    expect(feedback).toBe(withRecording);
    expect(step.waits).toEqual([]);
    expect(db.reads).toBe(0);
  });

  it("returns the Feedback read again with its Recording once it is attached", async () => {
    const step = fakeStep(attachedEvent);
    const db = fakeDatabase(withRecording);

    const feedback = await findFeedbackWithAwaitedRecording({
      event: createdEvent,
      step,
      feedback: withoutRecording,
      readFeedback: db.readFeedback,
    });

    expect(feedback).toEqual(withRecording);
    expect(db.reads).toBe(1);
  });

  it("returns the Feedback read again without a Recording past the delay", async () => {
    const step = fakeStep(null);
    const db = fakeDatabase(withoutRecording);

    const feedback = await findFeedbackWithAwaitedRecording({
      event: createdEvent,
      step,
      feedback: withoutRecording,
      readFeedback: db.readFeedback,
    });

    expect(feedback).toEqual(withoutRecording);
    expect(db.reads).toBe(1);
  });

  it("returns the Recording attached before the wait started, past the delay", async () => {
    const step = fakeStep(null);
    const db = fakeDatabase(withRecording);

    const feedback = await findFeedbackWithAwaitedRecording({
      event: createdEvent,
      step,
      feedback: withoutRecording,
      readFeedback: db.readFeedback,
    });

    expect(feedback).toEqual(withRecording);
  });

  it("waits for the attached event of this Feedback, for the shared delay", async () => {
    const step = fakeStep(null);

    await findFeedbackWithAwaitedRecording({
      event: createdEvent,
      step,
      feedback: withoutRecording,
      readFeedback: fakeDatabase(withoutRecording).readFeedback,
    });

    expect(step.waits).toEqual([
      {
        id: "wait-for-recording",
        opts: expect.objectContaining({
          timeout: RECORDING_WAIT_TIMEOUT_MS,
          if: 'async.data.feedbackId == "feedback_1"',
        }),
      },
    ]);
    expect(step.waits[0]?.opts).toHaveProperty(
      "event.name",
      "feedback/recording-attached",
    );
  });
});
