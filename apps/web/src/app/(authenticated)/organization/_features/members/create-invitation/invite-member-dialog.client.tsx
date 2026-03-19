"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const InviteMemberFormSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type InviteMemberFormInputs = z.infer<typeof InviteMemberFormSchema>;

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();
  const queryClient = useQueryClient();

  const form = useForm<InviteMemberFormInputs>({
    resolver: zodResolver(InviteMemberFormSchema),
    defaultValues: { email: "" },
  });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const createInvitation = useMutation(
    trpc.authenticated.organization.invitation.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.authenticated.organization.invitation.get.queryFilter(),
        );
        toast.success("Invitation sent successfully");
        handleOpenChange(false);
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message || "Error sending invitation.",
        });
      },
    }),
  );

  const onSubmit = (data: InviteMemberFormInputs) => {
    if (!activeOrg) return;

    createInvitation.mutate({
      organizationId: activeOrg.id,
      email: data.email,
      role: "member",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            Send an email invitation to add a new member to your organization.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {form.formState.errors.root && (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      disabled={createInvitation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createInvitation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInvitation.isPending}>
                {createInvitation.isPending ? "Sending..." : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
