"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();


  const { mutate, isPending } = trpc.auth.signout.useMutation(
    {
      onSuccess: () => {
        router.push('')
      }
    }
  );

  const handleSignOut = () => {
    mutate();
  };

  return (
    <DropdownMenuItem
      onClick={handleSignOut}
      disabled={isPending}
      className="cursor-pointer"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </DropdownMenuItem>
  );
}
