import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { CopyCommand } from "./copy-command.client";
import { HeroDotBackground } from "./hero-dot-background.client";

const objectionRemovers = [
  "2-minute setup",
  "No credit card required",
  "Open source",
];

export function HeroSection() {
  return (
    <HeroDotBackground>
      <section className="w-full py-24 md:py-32">
        <div className="container mx-auto flex flex-col items-center px-4 text-center">
          <h1 className="max-w-3xl text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            The open-source <br />
            feedback pipeline for <br />
            <span className="">AI-native dev teams.</span>
          </h1>

          <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
            Your clients annotate issues directly on your site. Every technical
            detail is captured automatically. Your coding agent gets a
            structured task and fixes it — no back-and-forth, no deciphering,
            just shipping.
          </p>

          <CopyCommand command="npm install @fasterfixes/react" />

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Get Started Free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>

          <ul className="text-muted-foreground mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {objectionRemovers.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </HeroDotBackground>
  );
}
