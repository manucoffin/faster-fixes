"use client";

import { getSession } from "@/lib/auth";
import { loginUrl } from "@/lib/routing";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

interface UpgradeSubscriptionButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  planName: string;
  isAnnual: boolean;
  onSuccess?: () => void;
  asChild?: boolean;
}

export function UpgradeSubscriptionButton({
  planName,
  isAnnual,
  ...props
}: UpgradeSubscriptionButtonProps) {
  const trpc = useTRPC();
  // const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const upgradePlanMutation =
    useMutation(trpc.subscription.upgrade.mutationOptions(
      {
        onSuccess: (data) => {
          // Redirect to Stripe checkout
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (error) => {
          console.error("Error upgrading plan:", error);
          toast(error.message);
        },
      },
    ));

  const handleUpgrade = useCallback(async () => {
    const { data: session } = await getSession()
    if (!session) {
      router.push(`${loginUrl}?callbackUrl=${pathname}`)
      return
    }

    await upgradePlanMutation.mutateAsync({
      planName,
      annual: isAnnual,
    });
  }, [upgradePlanMutation, isAnnual]);


  return (
    <Button
      onClick={() => handleUpgrade()}
      disabled={upgradePlanMutation.isPending}
      {...props}
    >
      {upgradePlanMutation.isPending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <span>
          Je choisis{" "}
          <span className="font-semibold capitalize">{planName}</span>
        </span>
      )}
    </Button>
  );
}
