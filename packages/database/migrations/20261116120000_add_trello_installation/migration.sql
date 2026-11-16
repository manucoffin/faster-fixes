-- CreateTable
CREATE TABLE "trello_installation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trelloMemberId" TEXT NOT NULL,
    "memberDisplayName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenScope" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "healthState" TEXT NOT NULL DEFAULT 'connected',
    "reconnectNotifiedAt" TIMESTAMP(3),
    "installedById" TEXT,

    CONSTRAINT "trello_installation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trello_installation_organizationId_key" ON "trello_installation"("organizationId");

-- CreateIndex
CREATE INDEX "trello_installation_organizationId_idx" ON "trello_installation"("organizationId");

-- AddForeignKey
ALTER TABLE "trello_installation" ADD CONSTRAINT "trello_installation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trello_installation" ADD CONSTRAINT "trello_installation_installedById_fkey" FOREIGN KEY ("installedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
