"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Skeleton } from "@workspace/ui/components/skeleton";

type ApiKeyMigrationNoticeProps = {
  projectId: string;
};

const INSTALL_COMMAND = "npm install @fasterfixes/react@latest";

function buildSnippet(publicId: string) {
  return `<FeedbackProvider projectId="${publicId}">
  {children}
</FeedbackProvider>`;
}

export function ApiKeyMigrationNotice({
  projectId,
}: ApiKeyMigrationNoticeProps) {
  const trpc = useTRPC();
  const projectQuery = useQuery(
    trpc.authenticated.projects.get.queryOptions({ projectId }),
  );

  return matchQueryStatus(projectQuery, {
    Loading: (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    ),
    // The snippet is the point of the card, and a placeholder Project ID would
    // be copied as if it were real, so the failure replaces the whole card.
    Errored: (error) => (
      <Alert variant="destructive">
        <AlertTitle>Failed to load the migration snippet</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    // The service throws when the Project is missing, so this branch only
    // narrows the loaded data for the snippet below.
    Empty: (
      <p className="text-sm text-muted-foreground">
        This project is unavailable.
      </p>
    ),
    Success: ({ data: project }) => {
      const snippet = buildSnippet(project.publicId);

      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              The widget now authenticates with your Project ID, shown in
              Project information above. Existing installs that use an API key
              continue to work.
            </p>
            <p className="text-sm text-muted-foreground">
              To migrate, update @fasterfixes/react to version 0.0.9 or later
              and pass your Project ID via the projectId prop.
            </p>
          </div>

          <div className="relative rounded-md border bg-muted p-3">
            <code className="font-mono text-sm">{INSTALL_COMMAND}</code>
            <CopyButton
              content={INSTALL_COMMAND}
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2"
            />
          </div>

          <div className="relative rounded-md border bg-muted p-3">
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
              <code>{snippet}</code>
            </pre>
            <CopyButton
              content={snippet}
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2"
            />
          </div>
        </div>
      );
    },
  });
}
