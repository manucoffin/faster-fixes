"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { AlertCircleIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UpdateProfileInputs, UpdateProfileSchema } from "./update-profile.schema";

export function ProfileForm() {

  const getProfileQuery = trpc.authenticated.account.settings.getProfile.useQuery();

  const form = useForm<UpdateProfileInputs>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Reset form when user data is available
  React.useEffect(() => {
    if (getProfileQuery.data) {
      form.reset({
        firstName: getProfileQuery.data.firstName ?? "",
        lastName: getProfileQuery.data.lastName ?? "",
      });
    }
  }, [getProfileQuery.data, form]);

  const updateProfileMutation = trpc.authenticated.account.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès")
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
          name="firstName"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Prénom</FormLabel>
              <FormControl>
                <Input placeholder="Entrez votre prénom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Entrez votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="self-start"
        >
          {updateProfileMutation.isPending
            ? "Mise à jour en cours..."
            : "Mettre à jour le profil"}
        </Button>
      </form>
    </Form>
  );
}
