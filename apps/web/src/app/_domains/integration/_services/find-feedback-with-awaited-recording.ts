import { feedbackRecordingAttachedEvent } from "@/server/inngest/events";

/**
 * How long an automatic Issue or announcement is held back for a Recording the
 * Widget declared. Past it, the Issue goes out without the Recording.
 */
export const RECORDING_WAIT_TIMEOUT_MS = 30_000;

type WaitStep = {
  waitForEvent: (
    id: string,
    opts: {
      event: typeof feedbackRecordingAttachedEvent;
      timeout: number;
      if: string;
    },
  ) => Promise<unknown>;
};

type FindFeedbackWithAwaitedRecordingInput<TFeedback> = {
  /** The event that started the run. */
  event: {
    name: string;
    data: { feedbackId: string; recordingFollows?: true };
  };
  step: WaitStep;
  /** The Feedback as the run first read it. */
  feedback: TFeedback;
  readFeedback: () => Promise<TFeedback | null>;
};

/**
 * The Feedback an automatic Issue or announcement is written from. When the
 * Widget declared a Recording that is not stored yet, waits for it up to
 * `RECORDING_WAIT_TIMEOUT_MS`, then reads the Feedback again whether it came
 * or not: the second read also catches a Recording attached between the first
 * read and the start of the wait. `null` when the Feedback is gone by then.
 */
export async function findFeedbackWithAwaitedRecording<
  TFeedback extends { recording: unknown },
>({
  event,
  step,
  feedback,
  readFeedback,
}: FindFeedbackWithAwaitedRecordingInput<TFeedback>): Promise<TFeedback | null> {
  // An Issue created by hand is answered at once: anything uploaded is stored by then.
  if (event.name === "feedback/integration-issue-requested") return feedback;
  if (!event.data.recordingFollows) return feedback;
  if (feedback.recording) return feedback;

  await step.waitForEvent("wait-for-recording", {
    event: feedbackRecordingAttachedEvent,
    timeout: RECORDING_WAIT_TIMEOUT_MS,
    if: `async.data.feedbackId == ${JSON.stringify(event.data.feedbackId)}`,
  });

  return readFeedback();
}

export type FindFeedbackWithAwaitedRecordingOutput = Awaited<
  ReturnType<typeof findFeedbackWithAwaitedRecording>
>;
