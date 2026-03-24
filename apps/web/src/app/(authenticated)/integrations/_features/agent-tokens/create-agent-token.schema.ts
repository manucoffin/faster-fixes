import { z } from "zod";

export const CreateAgentTokenSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Name is required").max(100),
  scopes: z
    .array(z.enum(["feedbacks:read", "feedbacks:update_status"]))
    .min(1, "Select at least one permission"),
});

export type CreateAgentTokenSchemaType = z.infer<typeof CreateAgentTokenSchema>;
