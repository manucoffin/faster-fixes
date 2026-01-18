"use server";

import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signOutMutation = publicProcedure.mutation(async () => {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
});
