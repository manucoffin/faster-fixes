"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { AlertCircleIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  UpdateProfileInputs,
  UpdateProfileSchema,
} from "./update-profile.schema";

export function ProfileForm() {
  const trpc = useTRPC();

  const getProfileQuery = useQuery(trpc.authenticated.account.profile.get.queryOptions());

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

  const updateProfileMutation =
    useMutation(trpc.authenticated.account.profile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        const message = error.message || "An error occurred.";
        form.setError("root", { message });
      },
    }));

  const onSubmit = async (data: UpdateProfileInputs) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{form.formState.errors.root.message}</p>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} />
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
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="self-end"
        >
          {updateProfileMutation.isPending
            ? "Updating..."
            : "Update profile"}
        </Button>
      </form>
    </Form>
  );
}
