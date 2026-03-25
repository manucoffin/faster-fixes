"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { LoaderIcon, StarIcon } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/manucoffin/faster-fixes";

function StarsBadge({ stars }: { stars: number }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
      <StarIcon className="size-3" />
      {stars}
    </span>
  );
}

export function GitHubStarsButton() {
  const trpc = useTRPC();
  const starsQuery = useQuery(trpc.github.fetchStars.queryOptions());

  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="gap-2"
      >
        <GithubIcon className="size-4" />
        Star us on GitHub
        {matchQueryStatus(starsQuery, {
          Loading: <LoaderIcon className="size-3 animate-spin" />,
          Errored: <></>,
          Empty: <></>,
          Success: ({ data }) =>
            data.stars !== null ? <StarsBadge stars={data.stars} /> : <></>,
        })}
      </a>
    </Button>
  );
}
