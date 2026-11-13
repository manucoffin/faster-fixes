import { APP_URL } from "@/app/_constants/app";
import { SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import type { Metadata } from "next";
import { FeatureCards } from "./_features/feature-cards";

const pageUrl = `${APP_URL}/features`;
const title = `Features · ${SITE_NAME}`;
const description =
  "Website annotation, bug reports with a replay, video review, a kanban board and an MCP server for coding agents. Everything FasterFixes does, in one place.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
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
      <section className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Features
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
          FasterFixes turns client feedback on a website or a video into a
          report a developer, or a coding agent, can act on. Here is what each
          part does.
        </p>

        <div className="mt-12">
          <FeatureCards />
        </div>
      </section>

      <BreadcrumbSchema
        items={[
          { name: "Home", url: APP_URL },
          { name: "Features", url: pageUrl },
        ]}
      />
    </div>
  );
}
