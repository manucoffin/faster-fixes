import type { ReactNode } from "react";

type PublicMessageProps = {
  title: string;
  description: ReactNode;
  children?: ReactNode;
};

// The shared shape of a bare public page reached by a private link (the
// Testimonial flow, a Video's Share link): a centered title and explanation,
// with an optional action or preview below.
export function PublicMessage({
  title,
  description,
  children,
}: PublicMessageProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl leading-snug font-semibold">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
