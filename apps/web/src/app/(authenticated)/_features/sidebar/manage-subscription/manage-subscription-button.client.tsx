"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { buttonVariants } from "@workspace/ui/components/button";
import { VariantProps } from "class-variance-authority";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManageSubscriptionButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function ManageSubscriptionButton({
  className,
  disabled,
  ...props
}: ManageSubscriptionButtonProps) {
  const createBillingPortalMutation =
    trpc.authenticated.createBillingPortal.useMutation(
      {
        onSuccess: async (data) => {
          // Redirect to billing portal
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );

  async function handleClick() {
    createBillingPortalMutation.mutate();
  }

  return (
    <button
      onClick={handleClick}
      disabled={createBillingPortalMutation.isPending || disabled}
      className={className}
      {...props}
    >
      {createBillingPortalMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Gérer mon abonnement</span>
        </>
      )}
    </button>

  );
}
