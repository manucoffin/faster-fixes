-- CreateTable
CREATE TABLE "github_installation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountAvatarUrl" TEXT,
    "installedById" TEXT NOT NULL,

    CONSTRAINT "github_installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_github_link" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "gitHubInstallationId" TEXT NOT NULL,
    "repoId" INTEGER NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "autoCreateIssues" BOOLEAN NOT NULL DEFAULT true,
    "defaultLabels" TEXT[] DEFAULT ARRAY['faster-fixes']::TEXT[],

    CONSTRAINT "project_github_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_issue_link" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "projectGitHubLinkId" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "issueUrl" TEXT NOT NULL,
    "issueState" TEXT NOT NULL DEFAULT 'open',
    "issueNodeId" TEXT,
    "lastSyncSource" TEXT,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "feedback_issue_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_installation_installationId_key" ON "github_installation"("installationId");

-- CreateIndex
CREATE INDEX "github_installation_organizationId_idx" ON "github_installation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "project_github_link_projectId_key" ON "project_github_link"("projectId");

-- CreateIndex
CREATE INDEX "project_github_link_gitHubInstallationId_idx" ON "project_github_link"("gitHubInstallationId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_issue_link_feedbackId_key" ON "feedback_issue_link"("feedbackId");

-- CreateIndex
CREATE INDEX "feedback_issue_link_projectGitHubLinkId_idx" ON "feedback_issue_link"("projectGitHubLinkId");

-- AddForeignKey
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_installedById_fkey" FOREIGN KEY ("installedById") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_github_link" ADD CONSTRAINT "project_github_link_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_github_link" ADD CONSTRAINT "project_github_link_gitHubInstallationId_fkey" FOREIGN KEY ("gitHubInstallationId") REFERENCES "github_installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_issue_link" ADD CONSTRAINT "feedback_issue_link_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_issue_link" ADD CONSTRAINT "feedback_issue_link_projectGitHubLinkId_fkey" FOREIGN KEY ("projectGitHubLinkId") REFERENCES "project_github_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
