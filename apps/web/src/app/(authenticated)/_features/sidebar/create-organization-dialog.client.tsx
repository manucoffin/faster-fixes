"use client";

import { organization } from "@/lib/auth";
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
import slugify from "slugify";
import z from "zod";

const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
});

type CreateOrganizationInputs = z.infer<typeof CreateOrganizationSchema>;

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<CreateOrganizationInputs>({
    resolver: zodResolver(CreateOrganizationSchema),
    defaultValues: { name: "" },
  });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = async (data: CreateOrganizationInputs) => {
    setIsPending(true);
    try {
      const slug = slugify(data.name, { lower: true, strict: true });

      const result = await organization.create({
        name: data.name,
        slug,
      });

      if (result.error) {
        form.setError("root", {
          message:
            result.error.message || "Erreur lors de la création de l'organisation.",
        });
        return;
      }

      if (result.data) {
        await organization.setActive({ organizationId: result.data.id });
      }

      toast.success("Organisation créée avec succès");
      handleOpenChange(false);
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
                {isPending ? "Création en cours..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
