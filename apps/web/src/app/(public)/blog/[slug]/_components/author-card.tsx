import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Separator } from "@/app/_components/ui/separator";
import type { Author, Media } from "@repo/payload/payload-types";
import Link from "next/link";

type AuthorCardProps = {
  author: Author;
};

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <Link href={`/auteurs/${author.slug}`} className="w-full">
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <Avatar className="border-background h-16 w-16 border-4">
              <AvatarImage
                src={(author.avatar as Media)?.url || ""}
                alt={author.name}
              />
              <AvatarFallback>
                {author.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">
                {author.name}
              </CardTitle>
              <p className="text-muted-foreground text-sm">Auteur</p>
            </div>
          </div>
        </CardHeader>
        <Separator className="my-4" />
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {author.bio || ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
