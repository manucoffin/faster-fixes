import { QuoteIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

type TestimonialCardProps = {
  name: string;
  role: string;
  image: string;
  children: ReactNode;
};

export function TestimonialCard({
  name,
  role,
  image,
  children,
}: TestimonialCardProps) {
  return (
    <div className="not-prose flex flex-col rounded-xl border border-border bg-card p-6">
      <QuoteIcon className="mb-4 size-5 text-primary" />
      <blockquote className="flex-1 space-y-3 text-base leading-relaxed text-muted-foreground">
        {children}
      </blockquote>
      <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-4">
        <Image
          src={image}
          alt={name}
          width={40}
          height={40}
          className="size-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
