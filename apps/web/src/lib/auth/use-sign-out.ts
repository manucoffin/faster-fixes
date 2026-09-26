"use client";

import { signOut } from "@/lib/auth";
import { getQueryClient } from "@/lib/trpc/trpc-client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useSignOut() {
  const router = useRouter();

  return useCallback(() => {
    // signOut reports failures in its result instead of rejecting, and callers bind this to onClick
    void signOut({
      fetchOptions: {
        onSuccess: () => {
          getQueryClient().clear();
          router.refresh();
        },
      },
    });
  }, [router]);
}
