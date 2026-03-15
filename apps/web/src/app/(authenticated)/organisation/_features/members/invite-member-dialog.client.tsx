"use client";

import { organization, useActiveOrganization } from "@/lib/auth";
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
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const InviteMemberSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type InviteMemberInputs = z.infer<typeof InviteMemberSchema>;

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent: () => void;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInviteSent,
}: InviteMemberDialogProps) {
  const { data: activeOrg } = useActiveOrganization();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<InviteMemberInputs>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: { email: "" },
  });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = async (data: InviteMemberInputs) => {
    if (!activeOrg) return;

    setIsPending(true);
    try {
      const result = await organization.inviteMember({
        organizationId: activeOrg.id,
        email: data.email,
        role: "member",
      });

      if (result.error) {
        form.setError("root", {
          message:
            result.error.message || "Erreur lors de l'envoi de l'invitation.",
        });
        return;
      }

      toast.success("Invitation envoyée avec succès");
      handleOpenChange(false);
      onInviteSent();
    } catch {
      form.setError("root", {
        message: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setIsPending(false);
    }
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
                      disabled={isPending}
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
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Envoi en cours..." : "Envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
