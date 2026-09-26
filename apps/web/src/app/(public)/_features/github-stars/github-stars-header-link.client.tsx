"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { Skeleton } from "@workspace/ui/components/skeleton";

const GITHUB_REPO_URL = "https://github.com/manucoffin/faster-fixes";

const starsFormatter = new Intl.NumberFormat("en", { notation: "compact" });

export function GitHubStarsHeaderLink() {
  const trpc = useTRPC();
  const starsQuery = useQuery(trpc.public.getGithubStars.queryOptions());

  return (
    <Button asChild variant="outline">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub repository"
      >
        <GithubIcon className="size-4.5" />
        {matchQueryStatus(starsQuery, {
          Loading: <Skeleton className="h-3.5 w-6" />,
          Errored: <></>,
          Empty: <></>,
          Success: ({ data }) =>
            data.stars !== null ? (
              <span className="text-[13px] leading-none font-medium tabular-nums">
                {starsFormatter.format(data.stars)}
              </span>
            ) : (
              <></>
            ),
        })}
      </a>
    </Button>
  );
}
