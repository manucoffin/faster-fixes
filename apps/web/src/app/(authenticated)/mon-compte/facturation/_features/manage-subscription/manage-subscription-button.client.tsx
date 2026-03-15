"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManageSubscriptionButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  onSuccess?: () => void;
  asChild?: boolean;
}

export function ManageSubscriptionButton({
  onSuccess,
  className,
  disabled,
  ...props
}: ManageSubscriptionButtonProps) {
  const createBillingPortalMutation =
    trpc.authenticated.account.billing.portal.create.useMutation({
      onSuccess: async (data) => {
        // Redirect to billing portal
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  async function handleClick() {
    createBillingPortalMutation.mutate();
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
          Chargement...
        </>
      ) : (
        "Gérer mon abonnement"
      )}
    </Button>
  );
}
