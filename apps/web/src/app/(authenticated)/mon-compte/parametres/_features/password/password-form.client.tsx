"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@workspace/ui/components/form";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { AlertCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChangePasswordInputs, ChangePasswordSchema } from "./change-password.schema";

export function PasswordForm() {

  const form = useForm<ChangePasswordInputs>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = trpc.authenticated.account.settings.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès")
      form.reset();
    },
    onError: (error) => {
      const message = error.message || "Une erreur s'est produite.";
      form.setError("root", { message });
    },
  });

  const onSubmit = async (data: ChangePasswordInputs) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
          name="currentPassword"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Mot de passe actuel</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Entrez votre mot de passe actuel"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Nouveau mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Entrez votre nouveau mot de passe"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 8 caractères, avec au moins une majuscule, une minuscule et un chiffre
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Confirmez votre nouveau mot de passe"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="self-start"
        >
          {changePasswordMutation.isPending
            ? "Changement en cours..."
            : "Changer le mot de passe"}
        </Button>
      </form>
    </Form>
  );
}
