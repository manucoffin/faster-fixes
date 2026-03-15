"use client";

import { signOut } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { AlertCircleIcon, AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  DeleteAccountInputs,
  DeleteAccountSchema,
} from "./delete-account.schema";

export function AccountDeletionButton() {
  const trpc = useTRPC();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const form = useForm<DeleteAccountInputs>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      password: "",
    },
  });

  const deleteAccountMutation = useMutation(trpc.authenticated.account.delete.mutationOptions({
    onSuccess: async () => {
      toast.success("Votre compte a été supprimé avec succès");
      setOpen(false);

      // Sign out and redirect
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
        },
      });
    },
    onError: (error) => {
      const message = error.message || "Une erreur s'est produite.";
      form.setError("root", { message });
    },
  }));

  const onSubmit = async (data: DeleteAccountInputs) => {
    deleteAccountMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      form.reset();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit self-end">
          Supprimer mon compte
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="text-destructive h-5 w-5" />
            <AlertDialogTitle>
              Supprimer définitivement votre compte
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Cette action est irréversible. Toutes vos données seront supprimées
            définitivement et vous ne pourrez pas récupérer votre compte.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  <p>{form.formState.errors.root.message}</p>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmez en entrant votre mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Entrez votre mot de passe"
                      autoComplete="current-password"
                      disabled={deleteAccountMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteAccountMutation.isPending}>
                Annuler
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending
                  ? "Suppression en cours..."
                  : "Confirmer la suppression"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
