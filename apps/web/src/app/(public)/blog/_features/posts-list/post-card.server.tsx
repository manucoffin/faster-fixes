import Link from "next/link";
import { GetPostsOutput } from "./get-posts.server.query";

interface PostCardProps {
  post: GetPostsOutput[0];
}

export function PostCard({ post }: PostCardProps) {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

  return (
    <article className="flex flex-col gap-3 border-b pb-6 last:border-b-0">
      <Link
        href={`/blog/${post.slug}`}
        className="group transition-colors hover:text-primary"
      >
        <h2 className="text-xl font-semibold group-hover:underline">
          {post.title}
        </h2>
      </Link>

      {post.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>
      )}

      {publishedDate && (
        <time className="text-xs text-muted-foreground">{publishedDate}</time>
      )}
    </article>
  );
}
