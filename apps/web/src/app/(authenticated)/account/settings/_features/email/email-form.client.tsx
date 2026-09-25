"use client";

import { changeEmail } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertCircleIcon, CheckIcon, InfoIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ChangeEmailInput } from "@/app/(authenticated)/account/settings/_services/change-email.schema";
import { ChangeEmailSchema } from "@/app/(authenticated)/account/settings/_services/change-email.schema";

export function EmailForm() {
  const trpc = useTRPC();

  const currentEmailQuery = useQuery(
    trpc.authenticated.account.email.get.queryOptions(),
  );

  return matchQueryStatus(currentEmailQuery, {
    Loading: (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-32 self-end" />
      </div>
    ),
    Errored: (error) => (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Failed to load your email address</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    // The service throws when the User is missing, so this branch only narrows
    // the loaded data for the fields below.
    Empty: (
      <p className="text-sm text-muted-foreground">
        Your email address is unavailable.
      </p>
    ),
    Success: ({ data }) => (
      <EmailFields
        currentEmail={data.currentEmail}
        emailVerified={data.emailVerified}
      />
    ),
  });
}

type EmailFieldsProps = {
  currentEmail: string;
  emailVerified: boolean;
};

function EmailFields({ currentEmail, emailVerified }: EmailFieldsProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  const form = useForm<ChangeEmailInput>({
    resolver: zodResolver(ChangeEmailSchema),
    values: {
      newEmail: currentEmail,
    },
  });

  const onSubmit = async (data: ChangeEmailInput) => {
    try {
      setIsPending(true);
      setShowSuccessMessage(false);

      await changeEmail({
        newEmail: data.newEmail,
        callbackURL: "/account/settings",
      });

      toast.success("Verification email sent!");
      setShowSuccessMessage(true);
      form.reset();
    } catch (error) {
      let errorMessage = "Unable to change email. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      form.setError("root", { message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
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

        {showSuccessMessage && (
          <Alert>
            <InfoIcon />
            <AlertTitle>Verification required</AlertTitle>
            <AlertDescription>
              <p>
                A verification email has been sent to your new address. Please
                check your inbox and click the link to confirm the change.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="newEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <MailIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    placeholder="nouveau@example.com"
                    {...field}
                  />
                  {emailVerified && (
                    <InputGroupAddon align="inline-end">
                      <CheckIcon className="text-success" />
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="self-end">
          {isPending ? "Sending..." : "Change email"}
        </Button>
      </form>
    </Form>
  );
}
