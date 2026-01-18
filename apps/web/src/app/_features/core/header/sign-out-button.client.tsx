"use client";

import { signOut } from "@/lib/auth";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh(); // Force refresh the server components that use the session
        },
      }
    })
  };

  return (
    <DropdownMenuItem
      onClick={handleSignOut}
      className="cursor-pointer"
    >
      Déconnexion
    </DropdownMenuItem>
  );
}
