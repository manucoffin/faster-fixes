"use client";

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
import { Separator } from "@workspace/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink, ImageOff, UserPlus } from "lucide-react";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";

type FeedbackItem = GetFeedbackOutput[number];

type OrgMember = {
  id: string;
  name: string | null;
  image: string | null;
};

type FeedbackDetailPanelProps = {
  feedback: FeedbackItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (feedbackId: string, status: string) => void;
  onAssigneeChange: (feedbackId: string, assigneeId: string | null) => void;
  orgMembers: OrgMember[];
  currentMemberId: string | null;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function formatBrowserMeta(f: FeedbackItem) {
  const parts: string[] = [];
  if (f.browserName) {
    parts.push(
      f.browserVersion ? `${f.browserName} ${f.browserVersion}` : f.browserName,
    );
  }
  if (f.os) parts.push(f.os);
  if (f.viewportWidth && f.viewportHeight) {
    parts.push(`${f.viewportWidth}\u00d7${f.viewportHeight}`);
  }
  return parts.join(" \u00b7 ");
}

export function FeedbackDetailPanel({
  feedback,
  open,
  onOpenChange,
  onStatusChange,
  onAssigneeChange,
  orgMembers,
  currentMemberId,
}: FeedbackDetailPanelProps) {
  if (!feedback) return null;

  const browserMeta = formatBrowserMeta(feedback);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="sr-only">Feedback detail</SheetTitle>
          <SheetDescription className="sr-only">
            View and manage feedback details
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4 pt-0">
          {/* Page URL */}
          <a
            href={feedback.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            {feedback.pageUrl}
            <ExternalLink className="size-3.5" />
          </a>

          {/* Comment */}
          <div>
            <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
              Comment
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.comment}
            </p>
          </div>

          <Separator />

          {/* Screenshot */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              Screenshot
            </h4>
            {feedback.screenshotUrl ? (
              <div className="flex flex-col gap-2">
                <img
                  src={feedback.screenshotUrl}
                  alt="Feedback screenshot"
                  className="w-full rounded-md border"
                />
                <div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
                  {feedback.clickX != null && feedback.clickY != null && (
                    <span>
                      Click: ({Math.round(feedback.clickX)},{" "}
                      {Math.round(feedback.clickY)})
                    </span>
                  )}
                  {feedback.selector && (
                    <span>Selector: {feedback.selector}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-8">
                <ImageOff className="size-8 opacity-50" />
                <span className="text-xs">No screenshot captured</span>
              </div>
            )}
          </div>

          {/* Browser Metadata */}
          {browserMeta && (
            <>
              <Separator />
              <div>
                <h4 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  Browser
                </h4>
                <p className="text-sm">{browserMeta}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Status */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              Status
            </h4>
            <Select
              value={feedback.status}
              onValueChange={(value) => onStatusChange(feedback.id, value)}
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

          {/* Assignee */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-muted-foreground text-xs font-medium uppercase">
                Assignee
              </h4>
              {currentMemberId && feedback.assignee?.id !== currentMemberId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAssigneeChange(feedback.id, currentMemberId)}
                >
                  <UserPlus className="mr-1 size-3" />
                  Assign to me
                </Button>
              )}
            </div>
            <Select
              value={feedback.assignee?.id ?? "unassigned"}
              onValueChange={(value) =>
                onAssigneeChange(
                  feedback.id,
                  value === "unassigned" ? null : value,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {orgMembers.map((member) => (
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

          <Separator />

          {/* Timestamps */}
          <div className="text-muted-foreground flex flex-col gap-1 text-xs">
            <span>
              Submitted by {feedback.reviewer.name} on{" "}
              {format(new Date(feedback.createdAt), "MMM d, yyyy")}
            </span>
            <span>
              Last updated{" "}
              {formatDistanceToNow(new Date(feedback.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
