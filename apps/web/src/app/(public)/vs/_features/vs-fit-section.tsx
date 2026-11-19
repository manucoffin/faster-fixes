import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon } from "lucide-react";
import { SectionHeading } from "../../features/_components/section-heading";

type VsFitSectionProps = {
  eyebrow: string;
  title: string;
  points: string[];
  tone?: "plain" | "muted";
};

// "Right fit if" checklist: heading beside a hairline list, like the FAQ.
export function VsFitSection({
  eyebrow,
  title,
  points,
  tone = "plain",
}: VsFitSectionProps) {
  return (
    <section
      className={cn("w-full py-20 md:py-28", tone === "muted" && "bg-muted/50")}
    >
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-4 text-sm text-muted-foreground">{eyebrow}</p>
          <SectionHeading>{title}</SectionHeading>
        </div>

        <ul className="border-t">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-4 border-b py-5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                <CheckIcon aria-hidden className="size-3.5 text-success" />
              </span>
              <span className="text-lg leading-relaxed text-pretty text-foreground">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
