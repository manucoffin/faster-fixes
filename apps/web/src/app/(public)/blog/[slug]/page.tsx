import { APP_URL } from "@/app/_constants/app";
import { AUTHOR } from "@/app/_constants/author";
import { PUBLISHER_LOGO, SITE_LANGUAGE, SITE_NAME } from "@/app/_constants/seo";
import { MdxLink } from "@/app/_components/mdx/mdx-link";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { blogSource } from "@/lib/blog/source";
import { getContentMDXComponents } from "mdx-components";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { BlogPosting, WithContext } from "schema-dts";
import { AuthorCard } from "./_features/author-card/author-card";
import { TableOfContents } from "./_features/table-of-contents/table-of-contents";

type Params = { slug: string };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function generateStaticParams(): Params[] {
  return blogSource
    .getPages()
    .map((page) => ({ slug: page.slugs[0] }))
    .filter((p): p is Params => Boolean(p.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = blogSource.getPage([slug]);
  if (!page) return {};

  const title = page.data.metaTitle ?? page.data.title;
  const description = page.data.metaDescription ?? page.data.description;
  const url = `${APP_URL}/blog/${slug}`;
  const ogUrl = `${APP_URL}/blog/${slug}/og`;

  return {
    title,
    description,
    keywords: page.data.keywords,
    alternates: { canonical: page.data.canonicalUrl ?? url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: page.data.date,
      modifiedTime: page.data.updatedAt ?? page.data.date,
      siteName: SITE_NAME,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: page.data.title,
        },
      ],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = blogSource.getPage([slug]);
  if (!page) notFound();

  const MDX = page.data.body;
  const postUrl = `${APP_URL}/blog/${slug}`;
  const ogUrl = `${APP_URL}/blog/${slug}/og`;
  const description = page.data.metaDescription ?? page.data.description ?? "";

  const blogPostingJsonLd: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: page.data.title,
    description,
    url: postUrl,
    datePublished: page.data.date,
    dateModified: page.data.updatedAt ?? page.data.date,
    image: ogUrl,
    inLanguage: SITE_LANGUAGE,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    ...(page.data.tags && page.data.tags.length > 0
      ? { articleSection: page.data.tags[0] }
      : {}),
    ...(page.data.keywords && page.data.keywords.length > 0
      ? { keywords: page.data.keywords.join(", ") }
      : {}),
    author: {
      "@type": "Person",
      "@id": AUTHOR.id,
      name: AUTHOR.name,
      url: AUTHOR.website,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: APP_URL,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}${PUBLISHER_LOGO.url}`,
        width: PUBLISHER_LOGO.width,
        height: PUBLISHER_LOGO.height,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <BreadcrumbSchema
        items={[
          { name: SITE_NAME, url: APP_URL },
          { name: "Blog", url: `${APP_URL}/blog` },
          { name: page.data.title, url: postUrl },
        ]}
      />
      <article className="mx-auto max-w-2xl px-4 py-12 text-xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            {page.data.title}
          </h1>
          <time
            dateTime={page.data.date}
            className="text-lg text-muted-foreground"
          >
            {dateFormatter.format(new Date(page.data.date))}
          </time>
        </header>

        <Image
          src={`/blog/${slug}/og`}
          alt={page.data.title}
          width={1200}
          height={630}
          sizes="(max-width: 672px) 100vw, 672px"
          className="mb-6 h-auto w-full rounded-lg"
          unoptimized
          priority
        />

        <TableOfContents headings={page.data.toc} />

        <div className="prose-xl dark:prose-invert prose max-w-none font-serif">
          <MDX components={getContentMDXComponents({ a: MdxLink })} />
        </div>

        <AuthorCard />
      </article>
    </>
  );
}
