import { getRelatedPosts } from "@/app/(public)/blog/_queries/get-related-posts";
import { H2 } from "@/app/_components/ui/headings";
import { Section } from "@/app/_components/ui/section";
import { BlogPostCard } from "@/app/_features/blog/_components/blog-post-card";

interface RelatedArticlesProps {
  currentPostId: number;
  categoryId: number;
  categoryName: string;
}

export async function RelatedArticles({
  currentPostId,
  categoryId,
  categoryName,
}: RelatedArticlesProps) {
  const relatedPosts = await getRelatedPosts(currentPostId, categoryId);

  // Don't render if no related posts
  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <Section className="bg-secondary/20">
      <div className="mx-auto max-w-(--breakpoint-lg)">
        <div className="mb-12 text-center">
          <H2 className="mx-auto text-3xl font-bold">
            Articles similaires dans{" "}
            <span className="text-primary">{categoryName}</span>
          </H2>
          <p className="text-muted-foreground mt-4 text-lg">
            Découvrez d&apos;autres articles qui pourraient vous intéresser
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {relatedPosts.map((post) => (
            <BlogPostCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
