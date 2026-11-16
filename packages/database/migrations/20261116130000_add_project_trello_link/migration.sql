-- CreateTable
CREATE TABLE "project_trello_link" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "trelloInstallationId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "boardName" TEXT NOT NULL,
    "boardUrl" TEXT NOT NULL,
    "newListId" TEXT NOT NULL,
    "inProgressListId" TEXT,
    "resolvedListId" TEXT NOT NULL,
    "autoCreateIssues" BOOLEAN NOT NULL DEFAULT true,
    "defaultLabelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "webhookId" TEXT,
    "linkHealthIssue" TEXT,

    CONSTRAINT "project_trello_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_trello_link_projectId_key" ON "project_trello_link"("projectId");

-- CreateIndex
CREATE INDEX "project_trello_link_trelloInstallationId_idx" ON "project_trello_link"("trelloInstallationId");

-- CreateIndex
CREATE INDEX "project_trello_link_boardId_idx" ON "project_trello_link"("boardId");

-- AddForeignKey
ALTER TABLE "project_trello_link" ADD CONSTRAINT "project_trello_link_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_trello_link" ADD CONSTRAINT "project_trello_link_trelloInstallationId_fkey" FOREIGN KEY ("trelloInstallationId") REFERENCES "trello_installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
