"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Check, Copy, RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type RegenerateApiKeySectionProps = {
  projectId: string;
};

export function RegenerateApiKeySection({
  projectId,
}: RegenerateApiKeySectionProps) {
  const trpc = useTRPC();

  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [keyCopied, setKeyCopied] = React.useState(false);
  const [regenOpen, setRegenOpen] = React.useState(false);

  const { data: project } = useQuery(
    trpc.authenticated.projets.get.queryOptions({ projectId }),
  );

  const regenerateApiKey = useMutation(
    trpc.authenticated.projets.regenerateApiKey.mutationOptions({
      onSuccess: (result) => {
        setNewApiKey(result.rawApiKey);
        setRegenOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleCopyKey = () => {
    if (!newApiKey) return;
    navigator.clipboard.writeText(newApiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted flex items-center gap-2 rounded-md border p-3">
        <code className="flex-1 font-mono text-sm">
          ff_••••••••••••••••••••••••••••••{project?.apiKeyLastFour}
        </code>
      </div>

      {newApiKey && (
        <div className="border-destructive/50 bg-destructive/10 rounded-md border p-3">
          <p className="text-destructive mb-2 text-xs font-medium">
            New key — copy it now, it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm break-all">
              {newApiKey}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopyKey}>
              {keyCopied ? (
                <Check className="text-success h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="self-end">
            <RefreshCw className="size-4" />
            Regenerate API key
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API key?</DialogTitle>
            <DialogDescription>
              The old key will be immediately invalidated. The widget will no
              longer be able to submit feedback until the new key is configured.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={regenerateApiKey.isPending}
              onClick={() => regenerateApiKey.mutate({ projectId })}
            >
              {regenerateApiKey.isPending ? "Regenerating..." : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
