"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { CopyButton } from "@workspace/ui/components/copy-button";

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
  const { data: project } = useQuery(
    trpc.authenticated.projects.get.queryOptions({ projectId }),
  );

  const snippet = buildSnippet(project?.publicId ?? "proj_...");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          The widget now authenticates with your Project ID, shown in Project
          information above. Existing installs that use an API key continue to
          work.
        </p>
        <p className="text-muted-foreground text-sm">
          To migrate, update @fasterfixes/react to version 0.0.9 or later and
          pass your Project ID via the projectId prop.
        </p>
      </div>

      <div className="bg-muted relative rounded-md border p-3">
        <code className="font-mono text-sm">{INSTALL_COMMAND}</code>
        <CopyButton
          content={INSTALL_COMMAND}
          variant="ghost"
          size="icon-xs"
          className="absolute top-2 right-2"
        />
      </div>

      <div className="bg-muted relative rounded-md border p-3">
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
}
