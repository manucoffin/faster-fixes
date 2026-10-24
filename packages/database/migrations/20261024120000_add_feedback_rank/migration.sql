-- CreateTable
CREATE TABLE "feedback_rank" (
    "feedbackId" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "feedback_rank_pkey" PRIMARY KEY ("feedbackId")
);

-- AddForeignKey
ALTER TABLE "feedback_rank" ADD CONSTRAINT "feedback_rank_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A Rank is valid only within the Status it was set in, so every Status change
-- clears it, whatever the writer (ADR-0017).
CREATE FUNCTION "feedback_clear_rank_on_status_change"() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "feedback_rank" WHERE "feedbackId" = NEW."id";
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "feedback_clear_rank_on_status_change"
AFTER UPDATE OF "status" ON "feedback"
FOR EACH ROW
WHEN (OLD."status" IS DISTINCT FROM NEW."status")
EXECUTE FUNCTION "feedback_clear_rank_on_status_change"();
