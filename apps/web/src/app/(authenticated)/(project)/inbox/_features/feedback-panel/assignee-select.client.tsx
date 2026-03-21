"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/use-feedback-mutations";
import { useOrgMembers } from "@/app/(authenticated)/(project)/inbox/_features/use-org-members";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { UserPlus } from "lucide-react";

type AssigneeSelectProps = {
  projectId: string;
  feedbackId: string;
  value: string | null;
};

export function AssigneeSelect({
  projectId,
  feedbackId,
  value,
}: AssigneeSelectProps) {
  const { updateAssignee } = useFeedbackMutations(projectId);
  const { members, currentMemberId } = useOrgMembers();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-muted-foreground text-xs font-medium uppercase">
          Assignee
        </h4>
        {currentMemberId && value !== currentMemberId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => updateAssignee(feedbackId, currentMemberId)}
          >
            <UserPlus className="mr-1 size-3" />
            Assign to me
          </Button>
        )}
      </div>
      <Select
        value={value ?? "unassigned"}
        onValueChange={(v) =>
          updateAssignee(feedbackId, v === "unassigned" ? null : v)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <div className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarImage src={member.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                {member.name ?? "Unknown"}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
