import { APP_URL } from "@/app/_constants/app";
import { SITE_LANGUAGE, SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_components/seo/breadcrumb-schema";
import { blogSource } from "@/lib/blog/source";
import type { Metadata } from "next";
import Link from "next/link";
import type { Blog, WithContext } from "schema-dts";

const pageUrl = `${APP_URL}/blog`;
const title = `Blog | ${SITE_NAME}`;
const description =
  "Practical guides, comparisons, and product notes for developer teams shipping client-facing work.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: { title, description, card: "summary_large_image" },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const blogJsonLd: WithContext<Blog> = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: `${SITE_NAME} Blog`,
  description,
  url: pageUrl,
  inLanguage: SITE_LANGUAGE,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: APP_URL,
  },
};

export default function BlogPage() {
  const posts = blogSource
    .getPages()
    .filter((page) => Boolean(page.data.date))
    .sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );

  return (
    <section className="py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BreadcrumbSchema
        items={[
          { name: SITE_NAME, url: APP_URL },
          { name: "Blog", url: pageUrl },
        ]}
      />
      <div className="container mx-auto px-5 md:px-0">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Practical guides and product notes for developer teams.
        </p>

        {posts.length === 0 ? (
          <div className="mt-16 flex items-center justify-center">
            <p className="text-lg text-muted-foreground">Posts coming soon.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const slug = post.slugs[0];
              if (!slug) return null;

              return (
                <Link
                  key={slug}
                  href={`/blog/${slug}`}
                  className="group flex flex-col gap-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- the card art is the post's own generated OG route, already sized and cached, so the image optimizer would only add a round trip */}
                  <img
                    src={`/blog/${slug}/og`}
                    alt={post.data.title}
                    className="h-auto w-full border border-border transition-transform duration-300 group-hover:scale-[1.02]"
                  />

                  <div className="flex flex-col gap-2">
                    {post.data.tags && post.data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.data.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="text-xl leading-tight font-bold tracking-tight transition-colors group-hover:text-primary">
                      {post.data.title}
                    </h2>

                    <time
                      dateTime={post.data.date}
                      className="text-sm text-muted-foreground"
                    >
                      {dateFormatter.format(new Date(post.data.date))}
                    </time>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {post.data.excerpt ?? post.data.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
