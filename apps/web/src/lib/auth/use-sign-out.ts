"use client";

import { signOut } from "@/lib/auth";
import { getQueryClient } from "@/lib/trpc/trpc-client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useSignOut() {
  const router = useRouter();

  return useCallback(() => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          getQueryClient().clear();
          router.refresh();
        },
      },
    });
  }, [router]);
}
