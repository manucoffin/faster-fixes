-- AlterTable
ALTER TABLE "feedback_trello_issue_link" ADD COLUMN "mirroredStatus" TEXT;

-- Backfill (ADR-0025): a link is mirrored on its Feedback's current Status when
-- the stored card position mirrors it against the Project link's lists
-- (ADR-0024), pending otherwise. An archived card mirrors closed, and resolved
-- too when archived from the resolved list. An open card mirrors the Status of
-- its mapped list, or any open Status in an unmapped list. On a board with no
-- in_progress list, an open card counts as mirroring in_progress wherever it
-- stayed. Feedback is never rewritten.
UPDATE "feedback_trello_issue_link" AS link
SET "mirroredStatus" = feedback."status"
FROM "feedback" AS feedback, "project_trello_link" AS board
WHERE feedback."id" = link."feedbackId"
  AND board."id" = link."projectTrelloLinkId"
  AND CASE
    WHEN link."archived" THEN
      feedback."status" = 'closed'
      OR (feedback."status" = 'resolved' AND link."listId" = board."resolvedListId")
    WHEN feedback."status" = 'closed' THEN FALSE
    WHEN feedback."status" = 'in_progress' AND board."inProgressListId" IS NULL THEN TRUE
    WHEN link."listId" = board."newListId" THEN feedback."status" = 'new'
    WHEN link."listId" = board."inProgressListId" THEN feedback."status" = 'in_progress'
    WHEN link."listId" = board."resolvedListId" THEN feedback."status" = 'resolved'
    ELSE TRUE
  END;
