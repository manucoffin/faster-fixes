"use client";

import { Column } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
} from "lucide-react";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span>{title}</span>

      <Button
        variant="ghost"
        size="icon"
        className=""
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {column.getIsSorted() === false && <ArrowUpDown className="size-4" />}
        {column.getIsSorted() === "asc" && (
          <ArrowUpWideNarrow className="size-4" />
        )}
        {column.getIsSorted() === "desc" && (
          <ArrowDownWideNarrow className="size-4" />
        )}
      </Button>
    </div>
  );
}
