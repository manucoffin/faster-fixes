import { signupUrl } from "@/app/_constants/routes";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="w-full py-24 md:py-32">
      <div className="container mx-auto flex flex-col items-center px-4 text-center">
        <Badge variant="outline" className="mb-6">
          2-minute setup
        </Badge>

        <h1 className="max-w-3xl text-4xl leading-tight font-bold md:text-5xl lg:text-6xl">
          Client feedback was never meant for developers
        </h1>

        <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
          Translating client requests into dev tasks is a PM or PO&apos;s job.
          In a small team, that falls on you. FasterFixes removes you from the
          loop — your clients report issues directly on your app, every
          technical detail is captured automatically, and your coding agent
          fixes them.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href={signupUrl}>
              Get Started Free
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
