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
  className?: string;
  children: ReactNode;
};

export function VsSection({
  eyebrow,
  title,
  intro,
  tone = "plain",
  className,
  children,
}: VsSectionProps) {
  return (
    <section
      className={cn(
        "w-full py-20 md:py-28",
        tone === "muted" && "bg-muted/50",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            intro && "lg:grid-cols-2 lg:items-end lg:gap-16",
          )}
        >
          <div>
            {eyebrow && (
              <p className="mb-4 text-sm text-muted-foreground">{eyebrow}</p>
            )}
            <SectionHeading>{title}</SectionHeading>
          </div>
          {intro && (
            <SectionBody className="max-w-2xl">
              <p>{intro}</p>
            </SectionBody>
          )}
        </div>

        <div className="mt-12 md:mt-16">{children}</div>
      </div>
    </section>
  );
}
