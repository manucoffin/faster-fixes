import { z } from "zod";

// Two 30 second slices, plus slack for a slice timer that fires late.
export const RECORDING_MAX_DURATION_MS = 65_000;

const FormIntegerSchema = z.string().regex(/^\d+$/).transform(Number);

/** The multipart text fields that travel with the Recording file. */
export const UpdateFeedbackRecordingSchema = z.object({
  durationMs: FormIntegerSchema.pipe(z.number().max(RECORDING_MAX_DURATION_MS)),
  // The replay format versions this server can read back.
  formatVersion: FormIntegerSchema.pipe(z.literal(1)),
});

export type UpdateFeedbackRecordingInput = z.infer<
  typeof UpdateFeedbackRecordingSchema
>;
