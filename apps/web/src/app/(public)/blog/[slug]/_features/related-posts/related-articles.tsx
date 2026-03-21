import { getRelatedPosts } from "@/app/(public)/blog/[slug]/_features/related-posts/get-related-posts.server.query";
import { H2 } from "@workspace/ui/components/headings";
import { Section } from "@workspace/ui/components/section";
import { PostCard } from "../../../_features/posts-list/post-card.server";

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
            Related articles in{" "}
            <span className="text-primary">{categoryName}</span>
          </H2>
          <p className="text-muted-foreground mt-4 text-lg">
            Discover more articles you might find interesting
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {relatedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
