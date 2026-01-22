import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ReactNode } from "react";

interface DashboardSectionProps {
  title: ReactNode;
  description: ReactNode;
  cardTitle?: string;
  children: ReactNode;
}

export function DashboardSection({
  title,
  description,
  cardTitle,
  children,
}: DashboardSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Section Info */}
      <div className="col-span-1">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Right Columns - Form Card */}
      <div className="col-span-2">
        <Card>
          {cardTitle && (
            <CardHeader className="sr-only">
              <CardTitle>{cardTitle}</CardTitle>
            </CardHeader>
          )}
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
