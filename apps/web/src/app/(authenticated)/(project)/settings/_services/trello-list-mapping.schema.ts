import { z } from "zod";

const MAPPED_LIST_FIELDS = [
  "newListId",
  "inProgressListId",
  "resolvedListId",
] as const;

// The Status mapping of ADR 0024. Mapped lists are distinct so that a card
// arriving in a list always names one Status; the check runs in the form and
// again in the link service, so a hand-made request cannot slip past it.
export const TrelloListMappingSchema = z
  .object({
    newListId: z.string().min(1, "Select a list for New."),
    inProgressListId: z.string().min(1).nullable(),
    resolvedListId: z.string().min(1, "Select a list for Resolved."),
  })
  .superRefine((mapping, ctx) => {
    const seen = new Set<string>();
    for (const field of MAPPED_LIST_FIELDS) {
      const listId = mapping[field];
      if (!listId) continue;
      if (seen.has(listId)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "This list already stands for another status.",
        });
      }
      seen.add(listId);
    }
  });

export type TrelloListMappingInput = z.infer<typeof TrelloListMappingSchema>;
