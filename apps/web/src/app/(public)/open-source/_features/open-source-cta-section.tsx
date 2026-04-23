import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function OpenSourceCtaSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ship client fixes without the overhead
          </h2>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl">
            Use the hosted version or self-host. Same product, same source.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Start free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="size-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
