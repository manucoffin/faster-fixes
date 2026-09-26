"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/feedback-mutations/use-feedback-mutations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

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

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
        Status
      </h4>
      <Select
        value={value}
        onValueChange={(status) => updateStatus(feedbackId, status)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
