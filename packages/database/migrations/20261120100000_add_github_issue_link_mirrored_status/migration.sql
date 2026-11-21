-- AlterTable
ALTER TABLE "feedback_issue_link" ADD COLUMN "mirroredStatus" TEXT;

-- Backfill (ADR-0025): a link is mirrored on its Feedback's current Status when
-- the stored state mirrors it (closed mirrors resolved and closed, open mirrors
-- new and in_progress), pending otherwise. Feedback is never rewritten.
UPDATE "feedback_issue_link" AS link
SET "mirroredStatus" = feedback."status"
FROM "feedback" AS feedback
WHERE feedback."id" = link."feedbackId"
  AND (link."issueState" = 'closed') = (feedback."status" IN ('resolved', 'closed'));
