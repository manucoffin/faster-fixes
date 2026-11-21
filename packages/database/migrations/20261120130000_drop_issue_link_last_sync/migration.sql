-- ADR-0025: the Mirrored Status replaced the time-window loop prevention, so
-- nothing reads these columns. The Slack link's "lastSyncAt" stays.

-- AlterTable
ALTER TABLE "feedback_issue_link" DROP COLUMN "lastSyncAt",
DROP COLUMN "lastSyncSource";

-- AlterTable
ALTER TABLE "feedback_jira_issue_link" DROP COLUMN "lastSyncAt",
DROP COLUMN "lastSyncSource";

-- AlterTable
ALTER TABLE "feedback_linear_issue_link" DROP COLUMN "lastSyncAt",
DROP COLUMN "lastSyncSource";

-- AlterTable
ALTER TABLE "feedback_trello_issue_link" DROP COLUMN "lastSyncAt",
DROP COLUMN "lastSyncSource";
