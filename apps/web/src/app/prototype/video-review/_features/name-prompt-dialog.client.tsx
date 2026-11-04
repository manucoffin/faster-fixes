"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useState } from "react";
import type { NamePrompt } from "./use-video-review";

type NamePromptDialogProps = {
  prompt: NamePrompt | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

// Shown once, at the first submit: the generated name is prefilled so a
// Reviewer in a hurry only has to confirm.
export function NamePromptDialog({
  prompt,
  onConfirm,
  onCancel,
}: NamePromptDialogProps) {
  return (
    <Dialog open={prompt !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        {prompt ? (
          <NamePromptForm
            key={prompt.suggestion}
            prompt={prompt}
            onConfirm={onConfirm}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type NamePromptFormProps = {
  prompt: NamePrompt;
  onConfirm: (name: string) => void;
};

function NamePromptForm({ prompt, onConfirm }: NamePromptFormProps) {
  const [name, setName] = useState(prompt.suggestion);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(name);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>How should the team see you?</DialogTitle>
        <DialogDescription>
          Your comments on this video will carry this name. Keep the suggested
          one or type your own.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="reviewer-name">Name</Label>
        <Input
          id="reviewer-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          aria-invalid={prompt.error !== null}
        />
        {prompt.error ? (
          <p className="text-sm text-destructive">{prompt.error}</p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="submit">Post as {name.trim() || "..."}</Button>
      </DialogFooter>
    </form>
  );
}
