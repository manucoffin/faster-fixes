"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { Switch } from "@workspace/ui/components/switch";
import { useState } from "react";

interface EmailVerifiedToggleProps {
  userId: string;
  isVerified: boolean | null;
}

export function EmailVerifiedToggle({
  userId,
  isVerified,
}: EmailVerifiedToggleProps) {
  const [optimisticState, setOptimisticState] = useState<boolean | null>(
    isVerified,
  );
  const utils = trpc.useUtils();

  const toggleEmailVerifiedMutation =
    trpc.admin.users.details.toggleEmailVerified.useMutation({
      onMutate: async (newData) => {
        // Cancel any outgoing refetches so they don't overwrite our optimistic update
        await utils.admin.users.details.getUserEmail.cancel({ userId });

        // Snapshot the previous value
        const previousData =
          utils.admin.users.details.getUserEmail.getData({ userId });

        // Optimistically update to the new value
        utils.admin.users.details.getUserEmail.setData(
          { userId },
          (old) =>
            old
              ? {
                ...old,
                emailVerified: newData.emailVerified,
              }
              : old,
        );

        // Also update local state for immediate UI feedback
        setOptimisticState(newData.emailVerified);

        // Return a context object with the snapshotted value
        return { previousData };
      },
      // If the mutation fails, roll back to the previous state
      onError: (_err, _newData, context) => {
        if (context?.previousData) {
          utils.admin.users.details.getUserEmail.setData(
            { userId },
            context.previousData,
          );
          setOptimisticState(context.previousData.emailVerified);
        }
      },
      // Always refetch after error or success to ensure consistency
      onSettled: () => {
        utils.admin.users.details.getUserEmail.invalidate({ userId });
      },
    });

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">
        {optimisticState ? "Email vérifié" : "Email non vérifié"}
      </label>
      <Switch
        checked={!!optimisticState}
        onCheckedChange={(checked) => {
          toggleEmailVerifiedMutation.mutate({
            userId,
            emailVerified: checked,
          });
        }}
        disabled={toggleEmailVerifiedMutation.isPending}
      />
    </div>
  );
}
