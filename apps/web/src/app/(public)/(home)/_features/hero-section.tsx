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
          The open-source feedback pipeline for AI-native dev teams.
        </h1>

        <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
          Your clients annotate issues directly on your site. Every technical
          detail is captured automatically. Your coding agent gets a structured
          task and fixes it — no back-and-forth, no deciphering, just shipping.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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
      </div>
    </section>
  );
}
