import { APP_URL } from "@/app/_constants/app";
import { DEFAULT_OG_IMAGE_URL, SITE_NAME } from "@/app/_constants/seo";
import { BreadcrumbSchema } from "@/app/_features/seo/breadcrumb-schema";
import { H1 } from "@workspace/ui/components/headings";
import { Section } from "@workspace/ui/components/section";
import { Metadata } from "next";
import { getPosts } from "./_features/posts-list/get-posts.server.query";
import { PostsList } from "./_features/posts-list/posts-list.server";
import { BlogCollectionPageSchema } from "./_features/seo/blog-collection-page-schema";
import { BlogItemListSchema } from "./_features/seo/blog-item-list-schema";

// Metadata for the main blog page
export const metadata: Metadata = {
  title: `Blog - ${SITE_NAME}`,
  description: "Explorez nos articles et publications. Restez informé des dernières actualités et tendances.",
  keywords: "blog, articles, publications, actualités",
  openGraph: {
    type: "website",
    title: `Blog - ${SITE_NAME}`,
    description: "Explorez nos articles et publications",
    url: `${APP_URL}/blog`,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        alt: `Blog - ${SITE_NAME}`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog - ${SITE_NAME}`,
    description: "Explorez nos articles et publications",
    images: [DEFAULT_OG_IMAGE_URL],
  },
  alternates: {
    canonical: `${APP_URL}/blog`,
    languages: {
      fr: `${APP_URL}/blog`,
      "x-default": `${APP_URL}/blog`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BlogPage() {
  // Fetch all published posts
  const posts = await getPosts();

  return (
    <div>
      <Section>
        <H1 className="mb-20">Blog</H1>
        <PostsList posts={posts} />
      </Section>

      {/* JSON-LD for SEO */}
      <BlogCollectionPageSchema />
      <BlogItemListSchema posts={posts} />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: APP_URL },
          { name: "Blog", url: `${APP_URL}/blog` },
        ]}
      />
    </div>
  );
}
