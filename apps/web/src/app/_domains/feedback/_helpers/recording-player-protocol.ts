import { z } from "zod";

/**
 * The messages the dashboard and the player document exchange over
 * `postMessage` (ADR-0023). Both sides parse every message they receive with
 * these schemas and ignore anything that does not validate.
 */

// Tags every message, so one posted by another script on the page never parses.
const CHANNEL = "fasterfixes/recording-player";

const RecordingPlayerEventSchema = z.looseObject({
  type: z.number(),
  timestamp: z.number(),
});

const DashboardMessageSchema = z.discriminatedUnion("type", [
  // The handshake: the dashboard announces it is listening.
  z.object({ channel: z.literal(CHANNEL), type: z.literal("listening") }),
  z.object({
    channel: z.literal(CHANNEL),
    type: z.literal("load"),
    events: z.array(RecordingPlayerEventSchema),
  }),
  z.object({ channel: z.literal(CHANNEL), type: z.literal("play") }),
  z.object({ channel: z.literal(CHANNEL), type: z.literal("pause") }),
  // A time in milliseconds from the start of the Recording.
  z.object({
    channel: z.literal(CHANNEL),
    type: z.literal("seek"),
    time: z.number().nonnegative(),
  }),
  // A playback rate, where 1 is the recorded pace.
  z.object({
    channel: z.literal(CHANNEL),
    type: z.literal("speed"),
    speed: z.number().positive().max(16),
  }),
]);

const PlayerMessageSchema = z.discriminatedUnion("type", [
  // The handshake: the player announces it is ready.
  z.object({ channel: z.literal(CHANNEL), type: z.literal("ready") }),
  // The playhead, in milliseconds from the start of the Recording.
  z.object({
    channel: z.literal(CHANNEL),
    type: z.literal("time"),
    time: z.number().nonnegative(),
  }),
  // Sent once the Recording is ready to play, paused on its first instant.
  z.object({
    channel: z.literal(CHANNEL),
    type: z.literal("loaded"),
    duration: z.number().nonnegative(),
    viewport: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
    }),
  }),
  z.object({
    channel: z.literal(CHANNEL),
    type: z.literal("state"),
    state: z.enum(["playing", "paused", "ended"]),
  }),
  // The Recording cannot be played.
  z.object({ channel: z.literal(CHANNEL), type: z.literal("failed") }),
]);

export type RecordingPlayerEvent = z.infer<typeof RecordingPlayerEventSchema>;

type WithoutChannel<T> = T extends unknown ? Omit<T, "channel"> : never;

export type DashboardMessage = WithoutChannel<
  z.infer<typeof DashboardMessageSchema>
>;
export type PlayerMessage = WithoutChannel<z.infer<typeof PlayerMessageSchema>>;
export type RecordingPlayerState = Extract<
  PlayerMessage,
  { type: "state" }
>["state"];
export type RecordingPlayerViewport = Extract<
  PlayerMessage,
  { type: "loaded" }
>["viewport"];

export function buildDashboardMessage(message: DashboardMessage) {
  return { channel: CHANNEL, ...message };
}

export function buildPlayerMessage(message: PlayerMessage) {
  return { channel: CHANNEL, ...message };
}

/** A message the player document accepts, or null for anything else. */
export function parseDashboardMessage(data: unknown): DashboardMessage | null {
  const result = DashboardMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}

/** A message the dashboard accepts, or null for anything else. */
export function parsePlayerMessage(data: unknown): PlayerMessage | null {
  const result = PlayerMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
