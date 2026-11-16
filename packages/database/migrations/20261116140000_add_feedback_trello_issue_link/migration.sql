-- CreateTable
CREATE TABLE "feedback_trello_issue_link" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "projectTrelloLinkId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardShortLink" TEXT NOT NULL,
    "cardUrl" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncSource" TEXT,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "feedback_trello_issue_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_trello_issue_link_feedbackId_key" ON "feedback_trello_issue_link"("feedbackId");

-- CreateIndex
CREATE INDEX "feedback_trello_issue_link_projectTrelloLinkId_idx" ON "feedback_trello_issue_link"("projectTrelloLinkId");

-- CreateIndex
CREATE INDEX "feedback_trello_issue_link_cardId_idx" ON "feedback_trello_issue_link"("cardId");

-- AddForeignKey
ALTER TABLE "feedback_trello_issue_link" ADD CONSTRAINT "feedback_trello_issue_link_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_trello_issue_link" ADD CONSTRAINT "feedback_trello_issue_link_projectTrelloLinkId_fkey" FOREIGN KEY ("projectTrelloLinkId") REFERENCES "project_trello_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
