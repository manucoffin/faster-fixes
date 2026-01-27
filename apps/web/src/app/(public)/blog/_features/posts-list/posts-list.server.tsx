import type { GetPostsOutput } from "./get-posts.server.query";
import { PostCard } from "./post-card.server";
import { Empty, EmptyDescription } from "@workspace/ui/components/empty";

interface PostsListProps {
  posts: GetPostsOutput;
}

export function PostsList({ posts }: PostsListProps) {
  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyDescription>Aucun article disponible.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
