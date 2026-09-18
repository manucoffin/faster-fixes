"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/feedback-mutations/use-feedback-mutations";
import { useOrgMembers } from "./use-org-members";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
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
  feedbackId: string;
  value: string | null;
};

export function AssigneeSelect({ feedbackId, value }: AssigneeSelectProps) {
  const { updateAssignee } = useFeedbackMutations();
  const { members, currentMemberId } = useOrgMembers();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">
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
                  <AvatarImage
                    src={member.image ? resolveS3Url(member.image) : undefined}
                    className="object-cover"
                  />
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
