"use client";

import { usePlanGate } from "@/app/_domains/subscription";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ChannelPicker } from "./link-channel/channel-picker.client";
import { SlackEnabledSwitch } from "./update-link/slack-enabled-switch.client";

type SlackSectionProps = {
  projectId: string;
};

export function SlackSection({ projectId }: SlackSectionProps) {
  const { data: activeOrg } = useActiveOrganization();
  const { canAccess } = usePlanGate();

  if (!canAccess("slackIntegration")) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Slack integration is available on paid plans.
        </p>
        <Button className="w-fit" asChild>
          <a href="/account/billing">Upgrade your plan</a>
        </Button>
      </div>
    );
  }

  return <SlackSectionInner orgId={activeOrg?.id} projectId={projectId} />;
}

type SlackSectionInnerProps = {
  orgId: string | undefined;
  projectId: string;
};

function SlackSectionInner({ orgId, projectId }: SlackSectionInnerProps) {
  const trpc = useTRPC();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.slack.getInstallation.queryOptions(
      undefined,
      { enabled: !!orgId },
    ),
  );

  return matchQueryStatus(installationQuery, {
    Loading: <Skeleton className="h-16 w-full" />,
    Errored: (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load Slack integration. Try refreshing the page.
        </AlertDescription>
      </Alert>
    ),
    Empty: (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Connect Slack in organization settings to pick a channel.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">Go to integrations</a>
        </Button>
      </div>
    ),
    Success: () => <PickChannel projectId={projectId} />,
  });
}

type PickChannelProps = {
  projectId: string;
};

function PickChannel({ projectId }: PickChannelProps) {
  const trpc = useTRPC();

  const linkQuery = useQuery(
    trpc.authenticated.projects.slack.getLink.queryOptions({ projectId }),
  );

  const channelsQuery = useQuery(
    trpc.authenticated.projects.slack.listChannels.queryOptions(),
  );

  return matchQueryStatus(linkQuery, {
    Loading: <Skeleton className="h-32 w-full" />,
    Errored: (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load Slack channel link. Try refreshing the page.
        </AlertDescription>
      </Alert>
    ),
    Success: ({ data: link }) =>
      matchQueryStatus(channelsQuery, {
        Loading: <Skeleton className="h-32 w-full" />,
        Errored: (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load Slack channels. Try refreshing the page.
            </AlertDescription>
          </Alert>
        ),
        Empty: (
          <p className="text-sm text-muted-foreground">
            No channels available. Invite the bot to a channel in Slack first.
          </p>
        ),
        Success: ({ data: channels }) => (
          <div className="flex flex-col gap-4">
            <ChannelPicker
              projectId={projectId}
              channels={channels}
              selectedChannelId={link?.channelId ?? ""}
            />
            {link ? (
              <SlackEnabledSwitch
                projectId={projectId}
                checked={link.enabled}
              />
            ) : null}
          </div>
        ),
      }),
  });
}
