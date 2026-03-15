"use client";

import { useSignOut } from "@/lib/auth/use-sign-out";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";

export function SignOutButton() {
  const handleSignOut = useSignOut();

  return (
    <DropdownMenuItem
      onClick={handleSignOut}
      className="cursor-pointer"
    >
      Sign out
    </DropdownMenuItem>
  );
}
