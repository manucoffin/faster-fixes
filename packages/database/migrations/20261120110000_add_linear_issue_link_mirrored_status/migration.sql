-- AlterTable
ALTER TABLE "feedback_linear_issue_link" ADD COLUMN "mirroredStatus" TEXT;

-- Backfill (ADR-0025): a link is mirrored on its Feedback's current Status when
-- the stored state type mirrors it (completed mirrors resolved, canceled closed,
-- started in_progress, the rest new), pending otherwise. Feedback is never
-- rewritten.
UPDATE "feedback_linear_issue_link" AS link
SET "mirroredStatus" = feedback."status"
FROM "feedback" AS feedback
WHERE feedback."id" = link."feedbackId"
  AND feedback."status" = CASE link."issueStateType"
    WHEN 'completed' THEN 'resolved'
    WHEN 'canceled' THEN 'closed'
    WHEN 'started' THEN 'in_progress'
    ELSE 'new'
  END;
