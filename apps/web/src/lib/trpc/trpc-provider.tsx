"use client";

import { getQueryClient, getUrl, TRPCProvider } from "@/lib/trpc/trpc-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc/routers/_app";
import superjson from "superjson";

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
});

export function TRPCProviderWrapper(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
