import { Badge } from "@/app/_components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList as BreadcrumbListUI,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/_components/ui/breadcrumb";
import { H1 } from "@/app/_components/ui/headings";
import { Section } from "@/app/_components/ui/section";
import { APP_URL } from "@/app/_constants/app";
import { DEFAULT_OG_IMAGE_URL } from "@/app/_constants/seo";
import { RichText } from "@/app/_features/payload/_components/rich-text";
import { BreadcrumbSchema } from "@/app/_features/seo/_components/breadcrumb-schema";
import { PersonSchema } from "@/app/_features/seo/_components/person-schema";
import { getPayloadClient } from "@/lib/payload/client";
import { PageParams } from "@/types/next";
import { isProduction } from "@/utils/environment/is-production";
import { cn } from "@/utils/styling/cn";
import type { Author, Category, Media, Tag } from "@repo/payload/payload-types";
import { CalendarIcon, TagIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleSchema } from "./_components/article-schema";
import { AuthorCard } from "./_components/author-card";
import { ImageObjectSchema } from "./_components/image-object-schema";
import { RelatedArticles } from "./_components/related-articles";
import { TableOfContents } from "./_components/table-of-contents";
import { WebPageSchema } from "./_components/webpage-schema";
import { getPostBySlug } from "./_queries/get-post-by-slug";

// Next.js will invalidate the cache when a
// request comes in, at most once every 60 seconds.
export const revalidate = 60;

// Static params generation
export async function generateStaticParams() {
  const payload = await getPayloadClient();
  try {
    const postsResult = await payload.find({
      collection: "posts",
      where: {
        status: {
          equals: "published",
        },
      },
      limit: 100, // Generate first 100 posts statically
    });

    return postsResult.docs.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params for posts:", error);
    return [];
  }
}

export default async function BlogPostPage(props: PageParams) {
  const params = await props.params;

  try {
    // Fetch post by slug
    const post = await getPostBySlug(params.slug);

    if (!post) {
      notFound();
    }

    // Ensure post types are properly typed
    const category = post.category as Category;
    const tags = post.tags as Tag[] | undefined;
    const author = post.author as Author;
    const featuredImage = post.featuredImage as Media | undefined;

    const proseClasses = cn(
      "prose",
      "prose-lg",
      "dark:prose-invert",
      {
        // Headings
        "prose-headings:font-bold": true,
        "prose-headings:mt-6": true,
        "prose-headings:mb-2": true,
      },
      {
        // Paragraphs
        "prose-p:mt-2": true,
        "prose-p:mb-4": true,
      },
      {
        "prose-a:relative": true,
        "prose-a:overflow-hidden": true,
        "prose-a:font-normal": true,
        "prose-a:underline": true,
        "prose-a:underline-offset-4": true,
        "prose-a:transition-colors": true,
        "prose-a:duration-300": true,
        "prose-a:decoration-primary": true,
        "prose-a:text-primary": true,
      },
      {
        // Unordered lists
        "prose-ul:mt-4": true,
      },
      {
        // List items
        "prose-li:mb-2": true,
      },
      {
        // Images
        "prose-img:rounded-lg": true,
      },
    );

    return (
      <>
        <Section className="mx-auto mb-20 max-w-(--breakpoint-md) pt-12 md:pt-16 md:pb-0">
          <article className="mb-20 w-full">
            <header className="mb-8">
              {/* Breadcrumb Navigation */}
              <Breadcrumb className="mb-8">
                <BreadcrumbListUI>
                  <BreadcrumbItem>
                    <Link
                      href="/blog"
                      className="hover:text-primary transition-colors"
                    >
                      Blog
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      {post.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbListUI>
              </Breadcrumb>

              {/* Category badge */}
              <Link
                href={`/blog/categories/${category.slug}`}
                className="mb-4 inline-block"
              >
                <Badge variant="secondary">{category.name}</Badge>
              </Link>

              {/* Article meta */}
              <div className="text-muted-foreground mb-6 flex items-center justify-start gap-6 text-sm">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  <time dateTime={post.publishedAt || post.createdAt}>
                    {new Date(
                      post.publishedAt || post.createdAt,
                    ).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </span>
                {post.readingTime && (
                  <>
                    <span>•</span>
                    <span className="">{post.readingTime} min de lecture</span>
                  </>
                )}
              </div>

              <H1 className="mb-4 text-4xl">{post.title}</H1>

              {post.excerpt && (
                <p className="text-muted-foreground mx-auto mb-6 max-w-3xl text-lg leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {featuredImage && (
                <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg md:h-[500px]">
                  <Image
                    src={featuredImage.url || ""}
                    alt={featuredImage.alt || post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 1200px"
                  />
                </div>
              )}
            </header>

            <TableOfContents content={post.content} />

            <section className={proseClasses}>
              <RichText data={post.content} enableDebug={!isProduction} />
            </section>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mt-12 border-t pt-8">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog/tag/${tag.slug}`}
                      className="transition-transform hover:scale-105"
                    >
                      <Badge
                        variant="outline"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          <AuthorCard author={author} />
        </Section>

        {/* Related Articles */}
        <RelatedArticles
          currentPostId={post.id}
          categoryId={category.id}
          categoryName={category.name}
        />

        {/* JSON-LD for SEO  */}
        <BreadcrumbSchema
          items={[
            { name: "Blog", url: `${APP_URL}/blog` },
            {
              name: post.title,
              url: `${APP_URL}/blog/${post.slug}`,
            },
          ]}
        />
        <ArticleSchema post={post} />
        <WebPageSchema post={post} />
        <ImageObjectSchema post={post} />
        <PersonSchema
          name={author.name}
          jobTitle="Author"
          description={author.bio || ""}
          image={(author.avatar as Media)?.url || ""}
          email={author.email || ""}
        />
      </>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}

export async function generateMetadata(props: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const params = await props.params;

  try {
    const post = await getPostBySlug(params.slug);

    if (!post) {
      return {
        title: "Article non trouvé",
        description: "L'article demandé n'a pas été trouvé.",
      };
    }

    const category = post.category as Category;
    const tags = post.tags as Tag[] | undefined;
    const author = post.author as Author;
    const featuredImage = post.featuredImage as Media | undefined;

    const title = post.meta?.title || post.title;
    const description =
      post.meta?.description || post.excerpt || "Article de blog sur Tobalgo";
    const imageUrl =
      featuredImage?.url ||
      (post.meta?.image as Media)?.url ||
      DEFAULT_OG_IMAGE_URL;
    const publishDate = new Date(
      post.publishedAt || post.createdAt,
    ).toISOString();

    return {
      title,
      description,
      authors: [
        {
          name: author.name,
          url: `${APP_URL}/blog/author/${author.slug || ""}`,
        },
      ],
      category: category.name,
      keywords: [
        ...(tags?.map((tag) => tag.name) || []),
        category.name,
        "soins vétérinaires",
        "animaux de compagnie",
        "tobalgo",
      ]
        .filter(Boolean)
        .join(", "),
      publisher: "Tobalgo",
      openGraph: {
        type: "article",
        title,
        description,
        url: `${APP_URL}/blog/${params.category}/${post.slug}`,
        siteName: "Tobalgo",
        images: [
          {
            url: imageUrl,
            alt: featuredImage?.alt || title,
            width: featuredImage?.width || 1200,
            height: featuredImage?.height || 630,
          },
        ],
        authors: [author.name],
        tags: tags?.map((tag) => tag.name) || [],
        publishedTime: publishDate,
        modifiedTime: new Date(post.updatedAt).toISOString(),
        section: category.name,
        locale: "fr_FR",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: "@tobalgo_app",
        site: "@tobalgo_app",
      },
      alternates: {
        canonical: `${APP_URL}/blog/${params.category}/${post.slug}`,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata for post:", error);

    return {
      title: "Article - Blog",
      description:
        "Blog Tobalgo - Articles sur les soins vétérinaires et les animaux de compagnie",
    };
  }
}
