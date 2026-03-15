"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
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
  email: z.string().email("Adresse email invalide"),
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

  const createInvitation =
    useMutation(trpc.authenticated.organisation.invitation.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.authenticated.organisation.invitation.get.queryFilter());
        toast.success("Invitation envoyée avec succès");
        handleOpenChange(false);
      },
      onError: (error) => {
        form.setError("root", {
          message:
            error.message || "Erreur lors de l'envoi de l'invitation.",
        });
      },
    }));

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
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour ajouter un nouveau membre à
            votre organisation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
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
                Annuler
              </Button>
              <Button type="submit" disabled={createInvitation.isPending}>
                {createInvitation.isPending
                  ? "Envoi en cours..."
                  : "Envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
