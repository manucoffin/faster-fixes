"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";
import { toast } from "sonner";
import type { ListAccessibleReposOutput } from "./list-accessible-repos.trpc.query";

type RepoPickerProps = {
  projectId: string;
  repos: ListAccessibleReposOutput;
};

export function RepoPicker({ projectId, repos }: RepoPickerProps) {
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
