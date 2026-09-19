import { z } from "zod";

const ConsoleEntrySchema = z.object({
  level: z.enum(["log", "info", "warn", "error", "debug"]),
  message: z.string(),
  timestamp: z.number(),
});

const NetworkEntrySchema = z.object({
  method: z.string(),
  url: z.string(),
  status: z.number(),
  duration: z.number(),
  timestamp: z.number(),
});

// Defensive caps above the widget's 50/stream bound — reject pathological payloads.
const DiagnosticTrailSchema = z.object({
  console: z.array(ConsoleEntrySchema).max(200),
  network: z.array(NetworkEntrySchema).max(200),
});

export const CreateFeedbackSchema = z.object({
  comment: z.string().trim().min(1),
  pageUrl: z.string().url(),
  selector: z.string().optional(),
  clickX: z.number().optional(),
  clickY: z.number().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  viewportWidth: z.number().int().optional(),
  viewportHeight: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  diagnosticTrail: DiagnosticTrailSchema.optional(),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;
