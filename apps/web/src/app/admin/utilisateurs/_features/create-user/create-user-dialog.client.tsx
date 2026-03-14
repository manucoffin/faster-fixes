"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@workspace/ui/components/action-button";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreateUserSchema, type CreateUserInputs } from "./create-user.schema";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const trpcUtils = trpc.useUtils();

  const createUserMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur créé avec succès");
      setOpen(false);
      form.reset();
      trpcUtils.admin.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de l'utilisateur");
    },
  });

  const form = useForm<CreateUserInputs>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: "",
      name: "",
      firstName: "",
      lastName: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: CreateUserInputs) => {
    await createUserMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Remplissez les informations de l&apos;utilisateur. Un mot de passe temporaire sera généré.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="utilisateur@example.com"
                      disabled={createUserMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean Dupont"
                      disabled={createUserMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean"
                      disabled={createUserMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de famille</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dupont"
                      disabled={createUserMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <ActionButton
                type="submit"
                disabled={!form.formState.isValid}
                pending={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Création..." : "Créer l'utilisateur"}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
