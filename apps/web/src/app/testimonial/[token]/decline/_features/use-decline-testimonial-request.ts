import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeclineTestimonialRequest(token: string) {
  const trpc = useTRPC();

  const mutation = useMutation(
    trpc.testimonial.decline.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return {
    decline: () => mutation.mutate({ token }),
    isPending: mutation.isPending,
    status: mutation.data?.status,
  };
}
