"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import * as React from "react";
import { useForm } from "react-hook-form";
import { UpdateProfileInputs, UpdateProfileSchema } from "./update-profile.schema";


interface ProfileFormProps {
  initialFirstName?: string | null;
  initialLastName?: string | null;
}

export function ProfileForm({
  initialFirstName,
  initialLastName,
}: ProfileFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useForm<UpdateProfileInputs>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      firstName: initialFirstName ?? "",
      lastName: initialLastName ?? "",
    },
  });

  const updateProfileMutation = trpc.authenticated.account.settings.updateProfile.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error) => {
      const message = error.message || "Une erreur s'est produite.";
      form.setError("root", { message });
    },
  });

  const onSubmit = async (data: UpdateProfileInputs) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isSuccess && (
          <div className="rounded-lg bg-green-50 p-4 text-green-800">
            Profil mis à jour avec succès
          </div>
        )}

        {form.formState.errors.root && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            {form.formState.errors.root.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom</FormLabel>
              <FormControl>
                <Input placeholder="Entrez votre prénom" {...field} />
              </FormControl>
              <FormDescription>
                Votre prénom tel qu'il apparaîtra dans votre profil
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Entrez votre nom" {...field} />
              </FormControl>
              <FormDescription>
                Votre nom tel qu'il apparaîtra dans votre profil
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="w-full"
        >
          {updateProfileMutation.isPending
            ? "Mise à jour en cours..."
            : "Mettre à jour le profil"}
        </Button>
      </form>
    </Form>
  );
}
