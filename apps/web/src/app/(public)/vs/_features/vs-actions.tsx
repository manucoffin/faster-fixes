import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

type VsActionsProps = {
  signupLabel: string;
  githubLabel: string;
  className?: string;
};

// The pair every /vs/ page closes a pitch with: hosted signup, or the source to self-host.
export function VsActions({
  signupLabel,
  githubLabel,
  className,
}: VsActionsProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      <Button asChild size="lg">
        <Link href={signupUrl}>
          {signupLabel}
          <ArrowRightIcon />
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          <GithubIcon className="size-5" />
          {githubLabel}
        </a>
      </Button>
    </div>
  );
}
