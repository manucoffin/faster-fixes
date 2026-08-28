import { APP_URL } from "@/app/_constants/app";
import { HowToSchema } from "@/app/_features/seo/how-to-schema";
import { source } from "@/lib/docs/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getDocsMDXComponents } from "mdx-components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docsHowToSchemas } from "./_features/docs-how-to-schemas";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const slugKey = page.slugs.join("/");
  const howTo = docsHowToSchemas[slugKey];

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <div className="flex items-center justify-between gap-4">
        <DocsTitle className="mb-0">{page.data.title}</DocsTitle>
        {page.slugs.length > 0 && (
          <MarkdownCopyButton
            markdownUrl={`/api/docs/${page.slugs.join("/")}`}
            className="not-prose shrink-0 cursor-pointer"
          />
        )}
      </div>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="pb-12">
        <MDX
          components={getDocsMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>

      {howTo && (
        <HowToSchema
          name={howTo.name}
          description={howTo.description}
          steps={howTo.steps}
        />
      )}
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const canonicalPath =
    page.slugs.length > 0 ? `/docs/${page.slugs.join("/")}` : "/docs";

  // Sidebar labels ("Introduction") make weak SERP snippets, so metaTitle /
  // metaDescription override the snippet without changing the navigation.
  const title = page.data.metaTitle ?? page.data.title;
  const description = page.data.metaDescription ?? page.data.description;

  return {
    title,
    description,
    ...(page.data.noindex && { robots: { index: false, follow: true } }),
    alternates: {
      canonical: `${APP_URL}${canonicalPath}`,
    },
    openGraph: {
      title,
      description,
      url: `${APP_URL}${canonicalPath}`,
    },
    twitter: {
      title,
      description,
    },
  };
}
