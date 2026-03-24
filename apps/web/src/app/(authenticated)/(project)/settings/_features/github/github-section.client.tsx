"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { ExternalLink, Github, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type GitHubSectionProps = {
  projectId: string;
};

export function GitHubSection({ projectId }: GitHubSectionProps) {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.github.getInstallation.queryOptions(
      undefined,
      { enabled: !!activeOrg?.id },
    ),
  );

  const linkQuery = useQuery(
    trpc.authenticated.projects.github.getLink.queryOptions(
      { projectId },
      { enabled: !!projectId },
    ),
  );

  const reposQuery = useQuery(
    trpc.authenticated.projects.github.listRepos.queryOptions(undefined, {
      enabled: !!installationQuery.data && !linkQuery.data,
    }),
  );

  const installation = installationQuery.data;
  const link = linkQuery.data;
  const repos = reposQuery.data ?? [];

  if (!installation) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Connect GitHub in organization settings to enable issue creation.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">
            Go to integrations
          </a>
        </Button>
      </div>
    );
  }

  if (link) {
    return <LinkedRepoView projectId={projectId} link={link} />;
  }

  return <RepoPicker projectId={projectId} repos={repos} />;
}

type LinkedRepoViewProps = {
  projectId: string;
  link: {
    id: string;
    repoFullName: string;
    autoCreateIssues: boolean;
    defaultLabels: string[];
  };
};

function LinkedRepoView({ projectId, link }: LinkedRepoViewProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    trpc.authenticated.projects.github.updateLink.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.github.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Settings updated.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const unlinkMutation = useMutation(
    trpc.authenticated.projects.github.unlinkRepo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.github.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Repository unlinked.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Github className="text-muted-foreground size-4" />
        <a
          href={`https://github.com/${link.repoFullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {link.repoFullName}
          <ExternalLink className="ml-1 inline size-3" />
        </a>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="auto-create" className="text-sm">
          Auto-create issues from feedback
        </Label>
        <Switch
          id="auto-create"
          checked={link.autoCreateIssues}
          onCheckedChange={(checked) =>
            updateMutation.mutate({
              projectId,
              autoCreateIssues: checked,
            })
          }
        />
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit">
            <Unlink className="mr-1 size-3" />
            Unlink repository
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink repository?</AlertDialogTitle>
            <AlertDialogDescription>
              New feedback will no longer create GitHub issues. Existing issues
              will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkMutation.mutate({ projectId })}
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type RepoPickerProps = {
  projectId: string;
  repos: { id: number; fullName: string; private: boolean }[];
};

function RepoPicker({ projectId, repos }: RepoPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedRepo, setSelectedRepo] = useState<string>("");

  const linkMutation = useMutation(
    trpc.authenticated.projects.github.linkRepo.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.github.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Repository linked.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const handleLink = () => {
    const repo = repos.find((r) => r.fullName === selectedRepo);
    if (!repo) return;

    const [owner, name] = repo.fullName.split("/");
    linkMutation.mutate({
      projectId,
      repoId: repo.id,
      repoOwner: owner!,
      repoName: name!,
      repoFullName: repo.fullName,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Select value={selectedRepo} onValueChange={setSelectedRepo}>
        <SelectTrigger>
          <SelectValue placeholder="Select a repository" />
        </SelectTrigger>
        <SelectContent>
          {repos.map((repo) => (
            <SelectItem key={repo.id} value={repo.fullName}>
              {repo.fullName}
            </SelectItem>
          ))}
          {repos.length === 0 && (
            <SelectItem value="_empty" disabled>
              No repositories available
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Button
        onClick={handleLink}
        disabled={!selectedRepo || linkMutation.isPending}
        className="w-fit"
      >
        Link repository
      </Button>
    </div>
  );
}
