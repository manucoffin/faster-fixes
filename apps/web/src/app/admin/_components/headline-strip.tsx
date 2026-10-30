import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

type HeadlineStripProps = {
  columns?: 4 | 5;
  children: React.ReactNode;
};

export function HeadlineStrip({ columns = 4, children }: HeadlineStripProps) {
  return (
    <Card className="py-0">
      <CardContent
        className={cn(
          "grid divide-y px-0 sm:grid-cols-2 sm:divide-y-0 lg:divide-x",
          columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
