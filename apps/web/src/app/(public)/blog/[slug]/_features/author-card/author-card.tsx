import { AUTHOR } from "@/app/_constants/author";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { LinkedinIcon } from "@workspace/ui/components/icons/linkedin-icon";
import { Globe } from "lucide-react";
import Image from "next/image";

export function AuthorCard() {
  return (
    <div className="mt-12 flex items-center gap-4 rounded-lg border p-4">
      <Image
        src="/images/avatar.jpg"
        alt={AUTHOR.name}
        width={64}
        height={64}
        className="rounded-full"
      />
      <div className="flex-1">
        <p className="font-semibold">{AUTHOR.name}</p>
        <p className="text-lg text-muted-foreground">{AUTHOR.bio}</p>
        <div className="mt-2 flex items-center gap-3">
          <a
            href={AUTHOR.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${AUTHOR.name}'s personal website`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Globe className="size-5" />
          </a>
          <a
            href={AUTHOR.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${AUTHOR.name}'s LinkedIn profile`}
            className="transition-opacity hover:opacity-80"
          >
            <LinkedinIcon className="size-5" />
          </a>
          <a
            href={AUTHOR.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${AUTHOR.name}'s GitHub profile`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <GithubIcon className="size-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
