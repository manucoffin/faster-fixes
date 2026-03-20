-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "feedback_assigneeId_idx" ON "feedback"("assigneeId");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
