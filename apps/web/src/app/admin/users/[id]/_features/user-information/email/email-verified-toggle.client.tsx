"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const trpc = useTRPC();
  const [optimisticState, setOptimisticState] = useState<boolean | null>(
    isVerified,
  );
  const queryClient = useQueryClient();

  const toggleEmailVerifiedMutation =
    useMutation(trpc.admin.users.email.toggleVerified.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries(trpc.admin.users.email.get.queryFilter({ userId }));

        const previousData =
          queryClient.getQueryData(trpc.admin.users.email.get.queryOptions({ userId }).queryKey);

        queryClient.setQueryData(
          trpc.admin.users.email.get.queryOptions({ userId }).queryKey,
          (old: any) =>
            old
              ? {
                ...old,
                emailVerified: newData.emailVerified,
              }
              : old,
        );

        setOptimisticState(newData.emailVerified);

        return { previousData };
      },
      onError: (_err, _newData, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.admin.users.email.get.queryOptions({ userId }).queryKey,
            context.previousData,
          );
          setOptimisticState(context.previousData.emailVerified);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(trpc.admin.users.email.get.queryFilter({ userId }));
      },
    }));

  return (
    <div className="flex items-center gap-4 justify-between">
      <label className="text-sm font-medium">
        {optimisticState ? "Email verified" : "Email not verified"}
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
