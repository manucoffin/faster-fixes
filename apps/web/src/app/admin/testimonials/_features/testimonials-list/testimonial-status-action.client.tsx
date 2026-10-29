"use client";

import type { UpdateTestimonialStatusInput } from "../../_services/update-testimonial-status.schema";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";

type TargetStatus = UpdateTestimonialStatusInput["status"];

const ACTIONS: Record<
  TargetStatus,
  { label: string; title: string; description: string; success: string }
> = {
  published: {
    label: "Publish",
    title: "Publish this testimonial?",
    description: "It becomes visible on the Faster Fixes website.",
    success: "Testimonial published",
  },
  rejected: {
    label: "Reject",
    title: "Reject this testimonial?",
    description: "A rejected testimonial cannot be published later.",
    success: "Testimonial rejected",
  },
  pending: {
    label: "Unpublish",
    title: "Unpublish this testimonial?",
    description:
      "It is removed from the Faster Fixes website and goes back to review.",
    success: "Testimonial unpublished",
  },
};

type TestimonialStatusActionProps = {
  testimonialId: string;
  status: TargetStatus;
};

export function TestimonialStatusAction({
  testimonialId,
  status,
}: TestimonialStatusActionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const action = ACTIONS[status];

  const updateStatusMutation = useMutation(
    trpc.admin.testimonials.updateStatus.mutationOptions({
      onSuccess: async () => {
        toast.success(action.success);
        await queryClient.invalidateQueries(
          trpc.admin.testimonials.list.queryFilter(),
        );
      },
      onError: (error) => {
        toast.error("Status not updated", { description: error.message });
      },
    }),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={status === "published" ? "default" : "outline"}
          disabled={updateStatusMutation.isPending}
        >
          {action.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{action.title}</AlertDialogTitle>
          <AlertDialogDescription>{action.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              updateStatusMutation.mutate({ testimonialId, status })
            }
            disabled={updateStatusMutation.isPending}
            variant={status === "rejected" ? "destructive" : "default"}
          >
            {action.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
