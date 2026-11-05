"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/feedback-mutations/use-feedback-mutations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { getFeedbackStatusAppearance } from "@/app/_domains/feedback/_components/feedback-status-appearance";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Archived" },
];

type StatusSelectProps = {
  feedbackId: string;
  value: string;
};

export function StatusSelect({ feedbackId, value }: StatusSelectProps) {
  const { updateStatus } = useFeedbackMutations();
  const appearance = getFeedbackStatusAppearance(value);
  const StatusIcon = appearance.icon;
  const label =
    STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80",
            appearance.pillClassName,
          )}
        >
          <StatusIcon className="size-3.5" />
          {label}
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(status) => updateStatus(feedbackId, status)}
        >
          {STATUS_OPTIONS.map((opt) => {
            const optAppearance = getFeedbackStatusAppearance(opt.value);
            const OptIcon = optAppearance.icon;
            return (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                <OptIcon
                  className={cn("size-3.5", optAppearance.iconClassName)}
                />
                {opt.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
