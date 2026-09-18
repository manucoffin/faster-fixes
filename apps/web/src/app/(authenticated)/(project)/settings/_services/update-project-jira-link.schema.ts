import { z } from "zod";
import { JiraLabelSchema } from "./link-jira-project.schema";

// Unlike Linear's update schema, this has no "project change" variant: switching
// the Jira project or issue type must re-run the required-fields check, so it
// goes back through linkJiraProject (whose upsert overwrites the existing link).
// What remains here are the two settings that carry no dependent IDs.
export const UpdateProjectJiraLinkSchema = z.object({
  projectId: z.string(),
  autoCreateIssues: z.boolean().optional(),
  defaultLabels: z.array(JiraLabelSchema).optional(),
});

export type UpdateProjectJiraLinkInput = z.infer<
  typeof UpdateProjectJiraLinkSchema
>;
