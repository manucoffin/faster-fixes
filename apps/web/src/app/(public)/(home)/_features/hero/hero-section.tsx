import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { CopyCommand } from "../copy-command.client";
import { HeroDotBackground } from "../hero-dot-background.client";
import { HeroFlowAnimation } from "./hero-flow-animation.client";

const objectionRemovers = ["2-minute setup", "No credit card required"];

export function HeroSection() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          {/* Left column: copy */}
          <div className="flex flex-col items-start">
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
                <Link href={"/docs" as Route}>Read the docs</Link>
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

          {/* Right column: flow animation */}
          <div className="flex flex-col gap-8">
            <span className="text-muted-foreground font-mono text-sm">
              {"// The open source feedback pipeline:"}
            </span>
            <HeroFlowAnimation />
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
