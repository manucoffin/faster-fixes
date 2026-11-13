import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";
import { ClickCommentReportAnimation } from "../_components/illustrations/click-comment-report-animation";
import { WebsiteAnnotationBreadcrumb } from "./website-annotation-breadcrumb";

export function WebsiteAnnotationHero() {
  return (
    <HeroDotBackground>
      <section className="w-full pt-8 pb-20 md:pb-24">
        <div className="container mx-auto px-4">
          <WebsiteAnnotationBreadcrumb />

          <div className="mt-12 grid grid-cols-1 items-center gap-12 md:mt-16 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col items-start">
              <h1 className="max-w-xl text-4xl leading-tight font-normal tracking-tight text-balance md:text-5xl lg:text-6xl">
                Website annotation tool for client reviews: click, comment, fix
              </h1>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={signupUrl}>
                    Get Started Free
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={"/docs/widget/overview" as Route}>
                    Read the docs
                  </Link>
                </Button>
              </div>
            </div>

            <ClickCommentReportAnimation />
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
