"use client";

import { resetPasswordUrl } from "@/lib/routing";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
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
import { AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ResetPasswordInputs, ResetPasswordSchema } from "./reset-password.schema";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const form = useForm<ResetPasswordInputs>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation(trpc.auth.resetPassword.mutationOptions({
    onError: (error) => {
      const message =
        error.message || "Échec de la réinitialisation du mot de passe. Veuillez réessayer.";
      form.setError("root", { message });
    },
    onSuccess: () => {
      router.replace(`${resetPasswordUrl}?success=true`);
    },
  }));

  const onSubmit = async (data: ResetPasswordInputs) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Server Error */}
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              <p>{form.formState.errors.root.message}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nouveau mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  {...field}
                  disabled={resetPasswordMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmez le mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  {...field}
                  disabled={resetPasswordMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={resetPasswordMutation.isPending}
          size="lg"
        >
          {resetPasswordMutation.isPending
            ? "Réinitialisation en cours..."
            : "Réinitialiser le mot de passe"}
        </Button>
      </form>
    </Form>
  );
}
