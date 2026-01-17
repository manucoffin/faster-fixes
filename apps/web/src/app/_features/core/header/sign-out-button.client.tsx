"use client";

import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";
import { trpc } from "@/lib/trpc/trpc-client";

export function SignOutButton() {
  const { mutate, isPending } = trpc.auth.signout.useMutation();

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
