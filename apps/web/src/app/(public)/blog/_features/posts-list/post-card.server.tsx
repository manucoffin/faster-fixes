import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card";
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

  const author = typeof post.author === "object" ? post.author.name : "";
  const featuredImage = typeof post.featuredImage === "object" ? post.featuredImage : null;

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full transition-transform hover:scale-105">
      <Card className="flex h-full flex-col overflow-hidden">
        {featuredImage && (
          <div className="relative h-48 w-full overflow-hidden bg-muted">
            <Image
              src={featuredImage.url || ""}
              alt={post.title}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        )}

        <CardContent className="flex flex-1 flex-col gap-3 pt-4">
          <h2 className="text-lg font-semibold group-hover:text-primary line-clamp-2">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          {author && (
            <p className="text-xs text-muted-foreground">{author}</p>
          )}
          {publishedDate && (
            <time className="text-xs text-muted-foreground">{publishedDate}</time>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
