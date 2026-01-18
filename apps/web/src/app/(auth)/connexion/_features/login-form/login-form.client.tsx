"use client";

import { defaultRedirect } from "@/lib/routing";
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
import { AlertCircleIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { LoginInputs, LoginSchema } from "./login.schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("nextUrl");

  const form = useForm<LoginInputs>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onError: (error) => {
      const message = error.message || "Échec de la connexion. Veuillez réessayer.";
      form.setError("root", { message });
    },
    onSuccess: (() => {
      router.push(nextUrl || defaultRedirect);
    })
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
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
              <FormLabel>Mot de passe</FormLabel>
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
