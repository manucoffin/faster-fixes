import type { ReactNode } from "react";

type TestimonialMessageProps = {
  title: string;
  description: ReactNode;
  children?: ReactNode;
};

// The shared shape of every page in the Testimonial flow besides the form:
// a centered title and explanation, with an optional action or preview below.
export function TestimonialMessage({
  title,
  description,
  children,
}: TestimonialMessageProps) {
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
