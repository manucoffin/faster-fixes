import { cn } from "@workspace/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SectionBody } from "../../features/_components/section-body";

export type VsPoint = {
  title: string;
  body: ReactNode;
  link?: { href: Route; label: string };
};

type VsPointGridProps = {
  points: VsPoint[];
  columns?: 1 | 2;
  className?: string;
};

// Titled points separated by hairlines instead of boxed in cards.
export function VsPointGrid({
  points,
  columns = 2,
  className,
}: VsPointGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-16 gap-y-10",
        columns === 2 && "md:grid-cols-2",
        className,
      )}
    >
      {points.map((point) => (
        <div key={point.title} className="border-t pt-6">
          <h3 className="text-xl font-medium tracking-tight">{point.title}</h3>
          <SectionBody className="mt-3 text-base">
            <p>{point.body}</p>
            {point.link && (
              <p>
                <Link href={point.link.href}>{point.link.label} →</Link>
              </p>
            )}
          </SectionBody>
        </div>
      ))}
    </div>
  );
}
