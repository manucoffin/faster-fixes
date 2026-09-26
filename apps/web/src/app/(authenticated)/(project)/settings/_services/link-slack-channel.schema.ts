import { z } from "zod";

export const LinkSlackChannelSchema = z.object({
  projectId: z.string(),
  channelId: z.string(),
  channelName: z.string(),
});

export type LinkSlackChannelInput = z.infer<typeof LinkSlackChannelSchema>;
