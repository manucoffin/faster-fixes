import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";
import { SectionBody } from "../../features/_components/section-body";
import { SectionHeading } from "../../features/_components/section-heading";

type VsSectionProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  // Muted sections alternate with plain ones, as on the feature pages.
  tone?: "plain" | "muted";
  // "split" keeps the heading beside the content, for sections of running text.
  layout?: "stacked" | "split";
  className?: string;
  children: ReactNode;
};

export function VsSection({
  eyebrow,
  title,
  intro,
  tone = "plain",
  layout = "stacked",
  className,
  children,
}: VsSectionProps) {
  const heading = (
    <div>
      {eyebrow && (
        <p className="mb-4 text-sm text-muted-foreground">{eyebrow}</p>
      )}
      <SectionHeading>{title}</SectionHeading>
    </div>
  );

  return (
    <section
      className={cn(
        "w-full py-20 md:py-28",
        tone === "muted" && "bg-muted/50",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        {layout === "split" ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">{heading}</div>
            <div className="lg:pt-9">{children}</div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "grid grid-cols-1 gap-6",
                intro && "lg:grid-cols-2 lg:items-end lg:gap-16",
              )}
            >
              {heading}
              {intro && (
                <SectionBody className="max-w-2xl">
                  <p>{intro}</p>
                </SectionBody>
              )}
            </div>

            <div className="mt-12 md:mt-16">{children}</div>
          </>
        )}
      </div>
    </section>
  );
}
