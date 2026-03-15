"use client";

import { SendVerificationEmailButton } from "@/app/_features/auth/send-verification-email-button/send-verification-email-button.client";
import { defaultRedirect, forgotPasswordUrl } from "@/lib/routing";
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
import { PasswordInput } from "@workspace/ui/components/password-input";
import { AlertCircleIcon, MailIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoginInputs, LoginSchema } from "./login.schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("nextUrl");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const form = useForm<LoginInputs>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onError: (error) => {
      if (error.message === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(form.getValues("email"));
        return;
      }
      const message = error.message || "Échec de la connexion. Veuillez réessayer.";
      form.setError("root", { message });
    },
    onSuccess: (() => {
      router.push((nextUrl || defaultRedirect) as Route);
    })
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setUnverifiedEmail(null);
    loginMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Not Verified */}
        {unverifiedEmail && (
          <Alert>
            <MailIcon />
            <AlertTitle>Email non confirmé</AlertTitle>
            <AlertDescription>
              <p>
                Veuillez confirmer votre adresse email avant de vous connecter.
              </p>
              <SendVerificationEmailButton
                email={unverifiedEmail}
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
                  disabled={loginMutation.isPending}
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
              <div className="flex items-center justify-between">
                <FormLabel>Mot de passe</FormLabel>
                <Link
                  href={forgotPasswordUrl}
                  className="text-xs text-primary hover:underline"
                >
                  Oublié ?
                </Link>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  {...field}
                  disabled={loginMutation.isPending}
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
          disabled={loginMutation.isPending}
          size="lg"
        >
          {loginMutation.isPending ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
    </Form>
  );
}
