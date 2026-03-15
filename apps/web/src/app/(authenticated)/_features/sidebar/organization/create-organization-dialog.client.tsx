"use client";

import { organization, useListOrganizations } from "@/lib/auth";
import { trpc } from "@/lib/trpc/trpc-client";
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
import {
  CreateOrganizationInputs,
  CreateOrganizationSchema,
} from "@/app/_features/organization/create-organization.schema";

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const { refetch: refetchOrganizations } = useListOrganizations();

  const form = useForm<CreateOrganizationInputs>({
    resolver: zodResolver(CreateOrganizationSchema),
    defaultValues: { name: "" },
  });

  const createOrganization =
    trpc.organization.create.useMutation({
      onSuccess: async (data) => {
        await organization.setActive({ organizationId: data.id });
        await refetchOrganizations();
        toast.success("Organisation créée avec succès");
        handleOpenChange(false);
      },
      onError: (error) => {
        form.setError("root", {
          message:
            error.message ||
            "Erreur lors de la création de l'organisation.",
        });
      },
    });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = (data: CreateOrganizationInputs) => {
    createOrganization.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une organisation</DialogTitle>
          <DialogDescription>
            Créez une nouvelle organisation pour collaborer avec votre équipe.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l&apos;organisation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mon organisation"
                      disabled={createOrganization.isPending}
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
                disabled={createOrganization.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createOrganization.isPending}>
                {createOrganization.isPending
                  ? "Création en cours..."
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
