"use client";

import { useSession } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { UpdateProfileInput } from "@/app/(authenticated)/account/settings/_services/update-profile.schema";
import { UpdateProfileSchema } from "@/app/(authenticated)/account/settings/_services/update-profile.schema";

export function ProfileForm() {
  const trpc = useTRPC();

  const profileQuery = useQuery(
    trpc.authenticated.account.profile.get.queryOptions(),
  );

  return matchQueryStatus(profileQuery, {
    Loading: (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-32 self-end" />
      </div>
    ),
    Errored: (error) => (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Failed to load your profile</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    // The service always returns both keys, so this branch only narrows the
    // loaded data for the fields below.
    Empty: (
      <p className="text-sm text-muted-foreground">
        Your profile is unavailable.
      </p>
    ),
    Success: ({ data }) => (
      <ProfileFields
        firstName={data.firstName ?? ""}
        lastName={data.lastName ?? ""}
      />
    ),
  });
}

type ProfileFieldsProps = {
  firstName: string;
  lastName: string;
};

function ProfileFields({ firstName, lastName }: ProfileFieldsProps) {
  const trpc = useTRPC();
  const { refetch: refetchSession } = useSession();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    values: {
      firstName,
      lastName,
    },
  });

  const updateProfileMutation = useMutation(
    trpc.authenticated.account.profile.update.mutationOptions({
      onSuccess: async () => {
        await refetchSession({ query: { disableCookieCache: true } });
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        const message = error.message || "An error occurred.";
        form.setError("root", { message });
      },
    }),
  );

  const onSubmit = async (data: UpdateProfileInput) => {
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
          {updateProfileMutation.isPending ? "Updating..." : "Update profile"}
        </Button>
      </form>
    </Form>
  );
}
