import { signupUrl } from "@/app/_constants/routes";
import { Badge } from "@workspace/ui/components/badge";
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
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          {/* Left column: copy */}
          <div className="flex flex-col items-start">
            <Badge
              variant="outline"
              className="mb-6 inline-flex items-center gap-2 px-3 py-1 text-sm"
            >
              <span className="bg-primary size-1.5 rounded-full" />
              The open source feedback pipeline
            </Badge>

            <h1 className="max-w-xl text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
              Client feedback that fixes itself.
            </h1>

            <p className="text-muted-foreground mt-6 max-w-lg text-lg md:text-xl">
              Your clients annotate issues directly on your live site. Every
              technical detail is captured automatically. Your AI agent receives
              a structured task and ships the fix. No more deciphering WhatsApp
              messages.
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

            <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {objectionRemovers.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column: product demo placeholder */}
          <div className="bg-muted/30 border-border flex aspect-[4/3] w-full items-center justify-center rounded-xl border">
            <p className="text-muted-foreground text-sm">Product demo</p>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
