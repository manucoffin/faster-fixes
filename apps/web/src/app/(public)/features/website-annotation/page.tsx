import { APP_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { FaqSchema } from "@/app/_components/seo/faq-schema";
import { SoftwareApplicationSchema } from "@/app/(public)/_components/seo/software-application-schema";
import { WebPageSchema } from "@/app/_components/seo/web-page-schema";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { WebsiteAnnotationBreadcrumb } from "./_features/website-annotation-breadcrumb";
import {
  WebsiteAnnotationCta,
  WebsiteAnnotationHowItWorks,
  WebsiteAnnotationIntro,
  WebsiteAnnotationMasking,
  WebsiteAnnotationMcp,
  WebsiteAnnotationOpenSource,
} from "./_features/website-annotation-content";
import {
  WebsiteAnnotationFaq,
  websiteAnnotationFaqs,
} from "./_features/website-annotation-faq";

const pageUrl = `${APP_URL}/features/website-annotation`;
const title = `Website annotation tool for client reviews · ${SITE_NAME}`;
const description =
  "A website annotation tool that also works as a feedback tool for websites: mask fields, block screenshots, self-host it, hand it to your agent.";
const datePublished = "2026-11-12T00:00:00.000Z";
const dateModified = "2026-11-12T00:00:00.000Z";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "website annotation tool",
    "website annotation",
    "annotate website",
    "web annotation tool",
    "website feedback tool",
    "feedback tool for websites",
    "open source website feedback tool",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
  },
  twitter: {
    title,
    description,
  },
};

export default function Page() {
  return (
    <div>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <WebsiteAnnotationBreadcrumb />

        <header className="mt-8 mb-10">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Website annotation for client reviews: click, comment, fix
          </h1>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Get Started Free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={"/docs/widget/overview" as Route}>Read the docs</Link>
            </Button>
          </div>
        </header>

        <div className="prose-lg dark:prose-invert prose max-w-none">
          <WebsiteAnnotationIntro />
          <WebsiteAnnotationHowItWorks />
          <WebsiteAnnotationMasking />
          <WebsiteAnnotationOpenSource />
          <WebsiteAnnotationMcp />
          <WebsiteAnnotationFaq />
          <WebsiteAnnotationCta />
        </div>
      </article>

      <SoftwareApplicationSchema />
      <WebPageSchema
        title={title}
        description={description}
        url={pageUrl}
        datePublished={datePublished}
        dateModified={dateModified}
        aboutId={`${APP_URL}#software`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: APP_URL },
          { name: "Features", url: `${APP_URL}/features` },
          { name: "Website annotation", url: pageUrl },
        ]}
      />
      <FaqSchema faqs={websiteAnnotationFaqs} />
    </div>
  );
}
