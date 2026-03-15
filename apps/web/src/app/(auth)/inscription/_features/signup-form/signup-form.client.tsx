"use client";

import { SendVerificationEmailButton } from "@/app/_features/auth/send-verification-email-button/send-verification-email-button.client";
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
import { Input } from "@workspace/ui/components/input";
import { PasswordInput } from "@workspace/ui/components/password-input";
import { PasswordStrengthIndicator } from "@workspace/ui/components/password-strength-indicator";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { SignupInputs, SignupSchema } from "./signup.schema";

export function SignupForm() {
  const trpc = useTRPC();
  const [success, setSuccess] = useState(false);

  const form = useForm<SignupInputs>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation(trpc.auth.signup.mutationOptions({
    onError: (error) => {
      const message =
        error.message || "Échec de la création du compte. Veuillez réessayer.";
      form.setError("root", { message });
    },
    onSuccess: (() => {
      setSuccess(true);
    })
  }));

  const onSubmit = async (data: SignupInputs) => {
    signupMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Success Message */}
        {success && (
          <Alert variant="success">
            <CheckCircleIcon />
            <AlertTitle>Succès</AlertTitle>
            <AlertDescription>
              <p>Un email de confirmation a été envoyé à votre adresse.</p>
              <SendVerificationEmailButton
                email={form.getValues("email")}
                size="sm"
                className="mt-2"
              >
                Renvoyer l&apos;email de confirmation
              </SendVerificationEmailButton>
            </AlertDescription>
          </Alert>
        )}

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
                  disabled={signupMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  {...field}
                  disabled={signupMutation.isPending}
                />
              </FormControl>
              <PasswordStrengthIndicator password={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />

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
                  disabled={signupMutation.isPending}
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
          disabled={signupMutation.isPending}
          size="lg"
        >
          {signupMutation.isPending ? "Création du compte..." : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
}
