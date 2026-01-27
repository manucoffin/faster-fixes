import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import Image from "next/image";
import Link from "next/link";
import { GetPostsOutput } from "./get-posts.server.query";

interface PostCardProps {
  post: GetPostsOutput[0];
}

export function PostCard({ post }: PostCardProps) {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("fr-FR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    : "";

  const author = typeof post.author === "object" ? post.author.name : "";
  const featuredImage = typeof post.featuredImage === "object" ? post.featuredImage : null;

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full transition-transform">
      <Card className="flex h-full flex-col pt-0 overflow-hidden">
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

        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          <CardDescription className="gap-2 flex items-center">
            {author && <span>par {author}</span>}
            {publishedDate && author && <span>•</span>}
            {publishedDate && <time>le {publishedDate}</time>}
          </CardDescription>
        </CardHeader>

        <CardContent className="">
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
