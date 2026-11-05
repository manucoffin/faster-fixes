"use client";

import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Separator } from "@workspace/ui/components/separator";
import { Switch } from "@workspace/ui/components/switch";
import { Share2 } from "lucide-react";
import { useState } from "react";

type VideoSharePopoverProps = {
  shareUrl: string | null;
  annotationsOpen: boolean;
  isReplacing: boolean;
  isUpdatingAnnotations: boolean;
  onReplaceLink: () => Promise<unknown>;
  onAnnotationsOpenChange: (open: boolean) => void;
};

export function VideoSharePopover({
  shareUrl,
  annotationsOpen,
  isReplacing,
  isUpdatingAnnotations,
  onReplaceLink,
  onAnnotationsOpenChange,
}: VideoSharePopoverProps) {
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);

  const handleReplace = async () => {
    try {
      await onReplaceLink();
      setIsConfirmingReplace(false);
    } catch {
      // The toast already reports it; the confirm step stays for a retry.
    }
  };

  return (
    <Popover onOpenChange={() => setIsConfirmingReplace(false)}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-share-link">Share link</Label>
          {shareUrl ? (
            <div className="flex gap-2">
              <Input
                id="video-share-link"
                readOnly
                value={shareUrl}
                className="font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <CopyButton
                content={shareUrl}
                variant="outline"
                size="icon"
                aria-label="Copy link"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This link cannot be displayed. Replace it to get a new one.
            </p>
          )}
          {isConfirmingReplace ? (
            <div className="space-y-2 rounded-md bg-muted p-3">
              <p className="text-sm">
                Everyone holding the current link loses access.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isReplacing}
                  onClick={() => setIsConfirmingReplace(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isReplacing}
                  onClick={() => void handleReplace()}
                >
                  {isReplacing ? "Replacing..." : "Replace link"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="-ml-2"
              onClick={() => setIsConfirmingReplace(true)}
            >
              Replace link
            </Button>
          )}
        </div>
        <Separator />
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="video-annotations-open">Annotations</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {annotationsOpen ? "Open" : "Closed"}
              </span>
              <Switch
                id="video-annotations-open"
                checked={annotationsOpen}
                disabled={isUpdatingAnnotations}
                onCheckedChange={onAnnotationsOpenChange}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            When closed, reviewers can watch the video and read its feedback but
            cannot add new feedback.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
