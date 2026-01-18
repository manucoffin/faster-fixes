"use client";

import { loginUrl } from "@/lib/routing";
import { trpc } from "@/lib/trpc/trpc-client";
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
import { Input } from "@workspace/ui/components/input";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ForgotPasswordInputs, ForgotPasswordSchema } from "./forgot-password.schema";

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onError: (error) => {
      const message = error.message || "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer.";
      form.setError("root", { message });
    },
    onSuccess: () => {
      form.reset();
      form.clearErrors();
    },
  });

  const onSubmit = async (data: { email: string }) => {
    forgotPasswordMutation.mutate(data);
  };

  const isSuccess = forgotPasswordMutation.isSuccess && !form.formState.errors.root;

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

        {/* Success Message */}
        {isSuccess && (
          <Alert variant="success" >
            <CheckCircleIcon />
            <AlertTitle >Succès</AlertTitle>
            <AlertDescription>
              <p>Un email de réinitialisation a été envoyé à votre adresse email.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jean@exemple.com"
                  {...field}
                  disabled={forgotPasswordMutation.isPending}
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
          disabled={forgotPasswordMutation.isPending || isSuccess}
          size="lg"
        >
          {forgotPasswordMutation.isPending ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">
          Vous vous souvenez de votre mot de passe ?{" "}
        </span>
        <Link
          href={loginUrl}
          className="font-medium text-primary hover:underline"
        >
          Se connecter
        </Link>
      </div>
    </Form>
  );
}
