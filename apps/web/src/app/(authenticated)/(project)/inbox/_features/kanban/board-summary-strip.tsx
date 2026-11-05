import { cn } from "@workspace/ui/lib/utils";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import {
  getBoardSummary,
  WAITING_THRESHOLD_DAYS,
} from "../../_helpers/board-summary";
import { getFeedbackStatusAppearance } from "@/app/_domains/feedback/_components/feedback-status-appearance";
import { ColumnSelectCheckbox } from "./column-select-checkbox.client";

type BoardSummaryStripProps = {
  columns: readonly { id: string; title: string }[];
  feedback: ListFeedbackOutput;
  selectedIds: Set<string>;
  onToggleSelectAll: (columnId: string, itemIds: string[]) => void;
};

export function BoardSummaryStrip({
  columns,
  feedback,
  selectedIds,
  onToggleSelectAll,
}: BoardSummaryStripProps) {
  const summary = getBoardSummary(feedback, new Date());
  const counts: Record<string, number> = {
    new: summary.newCount,
    in_progress: summary.inProgressCount,
    resolved: summary.resolvedCount,
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="grid grid-cols-3 divide-x">
        {columns.map((col) => {
          const appearance = getFeedbackStatusAppearance(col.id);
          const StatusIcon = appearance.icon;
          const itemIds = feedback
            .filter((f) => f.status === col.id)
            .map((f) => f.id);

          return (
            <div key={col.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ColumnSelectCheckbox
                  className="mr-1"
                  columnTitle={col.title}
                  itemIds={itemIds}
                  selectedIds={selectedIds}
                  onToggle={() => onToggleSelectAll(col.id, itemIds)}
                />
                <StatusIcon
                  className={cn("size-3.5", appearance.iconClassName)}
                />
                {col.title}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {counts[col.id] ?? 0}
                </span>
                {col.id === "new" && summary.unassignedNewCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {summary.unassignedNewCount} unassigned
                  </span>
                )}
                {col.id === "new" &&
                  summary.oldestNewWaitingDays >= WAITING_THRESHOLD_DAYS && (
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      oldest {summary.oldestNewWaitingDays}d
                    </span>
                  )}
                {col.id === "resolved" && summary.total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {summary.resolvedPercent}% of the board
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution bar: one segment per status, sized by its share. */}
      <div className="flex h-1 overflow-hidden rounded-b-lg bg-muted">
        {columns.map((col) => {
          const count = counts[col.id] ?? 0;
          if (!count) return null;
          return (
            <div
              key={col.id}
              className={cn(
                "h-full",
                getFeedbackStatusAppearance(col.id).swatchClassName,
              )}
              style={{ width: `${(count / summary.total) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
