"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Check, Copy, Plus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const AVAILABLE_SCOPES = [
  { value: "feedbacks:read", label: "Read feedbacks" },
  { value: "feedbacks:update_status", label: "Update feedback status" },
] as const;

export function CreateAgentTokenDialog() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrganization();

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [scopes, setScopes] = React.useState<string[]>([
    "feedbacks:read",
    "feedbacks:update_status",
  ]);
  const [rawToken, setRawToken] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const createToken = useMutation(
    trpc.authenticated.integrations.agentToken.create.mutationOptions({
      onSuccess: (result) => {
        setRawToken(result.rawToken);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleCreate = () => {
    if (!activeOrg?.id || !name.trim() || scopes.length === 0) return;
    createToken.mutate({
      organizationId: activeOrg.id,
      name: name.trim(),
      scopes: scopes as ("feedbacks:read" | "feedbacks:update_status")[],
    });
  };

  const handleCopy = () => {
    if (!rawToken) return;
    navigator.clipboard.writeText(rawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Invalidate on close so the list refreshes only after the user has copied the token
      if (rawToken) {
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.integrations.agentToken.list.queryKey({
            organizationId: activeOrg?.id ?? "",
          }),
        });
      }
      setName("");
      setScopes(["feedbacks:read", "feedbacks:update_status"]);
      setRawToken(null);
      setCopied(false);
    }
    setOpen(next);
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="size-4" />
          Create token
        </Button>
      </DialogTrigger>
      <DialogContent>
        {rawToken ? (
          <>
            <DialogHeader>
              <DialogTitle>Agent token created</DialogTitle>
              <DialogDescription>
                Copy this token now. It will not be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="border-destructive/50 bg-destructive/10 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm break-all">
                  {rawToken}
                </code>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="text-success size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create agent token</DialogTitle>
              <DialogDescription>
                This token authenticates the Faster Fixes MCP server, giving
                your AI coding agent access to feedback across all projects in
                this organization.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="token-name">Name</Label>
                <Input
                  id="token-name"
                  placeholder="e.g. Claude Code"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Permissions</Label>
                {AVAILABLE_SCOPES.map((scope) => (
                  <div key={scope.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`integrations-${scope.value}`}
                      checked={scopes.includes(scope.value)}
                      onCheckedChange={() => toggleScope(scope.value)}
                    />
                    <Label
                      htmlFor={`integrations-${scope.value}`}
                      className="font-normal"
                    >
                      {scope.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  createToken.isPending || !name.trim() || scopes.length === 0
                }
                onClick={handleCreate}
              >
                {createToken.isPending ? "Creating..." : "Create token"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
