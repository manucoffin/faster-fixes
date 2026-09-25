"use client";

import { canManageBilling } from "@/app/_domains/organization";
import { useActiveMemberRole } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import type { buttonVariants } from "@workspace/ui/components/button";
import { Button } from "@workspace/ui/components/button";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type ManageSubscriptionButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function ManageSubscriptionButton({
  className,
  disabled,
  ...props
}: ManageSubscriptionButtonProps) {
  const trpc = useTRPC();
  const { data: memberRole } = useActiveMemberRole();

  const createBillingPortalMutation = useMutation(
    trpc.authenticated.account.billing.portal.create.mutationOptions({
      onSuccess: async (data) => {
        // Redirect to billing portal
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  async function handleClick() {
    createBillingPortalMutation.mutate();
  }

  if (!canManageBilling(memberRole?.role ?? "")) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={createBillingPortalMutation.isPending || disabled}
      className={className}
      {...props}
    >
      {createBillingPortalMutation.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Manage subscription"
      )}
    </Button>
  );
}
