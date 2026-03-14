"use client";

import { changeEmail } from "@/lib/auth";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import { AlertCircleIcon, CheckIcon, InfoIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChangeEmailInputs, ChangeEmailSchema } from "./change-email.schema";

export function EmailForm() {
  const [isPending, setIsPending] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  const getCurrentEmailQuery = trpc.authenticated.account.email.get.useQuery();

  const form = useForm<ChangeEmailInputs>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  React.useEffect(() => {
    if (getCurrentEmailQuery.data?.currentEmail) {
      form.setValue("newEmail", getCurrentEmailQuery.data.currentEmail);
    }
  }, [getCurrentEmailQuery.data?.currentEmail, form]);

  const onSubmit = async (data: ChangeEmailInputs) => {
    try {
      setIsPending(true);
      setShowSuccessMessage(false);

      await changeEmail({
        newEmail: data.newEmail,
        callbackURL: "/mon-compte/parametres",
      });

      toast.success("Email de vérification envoyé !");
      setShowSuccessMessage(true);
      form.reset();
    } catch (error) {
      let errorMessage = "Impossible de changer l'email. Veuillez réessayer.";

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

        {showSuccessMessage && (
          <Alert>
            <InfoIcon />
            <AlertTitle>Vérification requise</AlertTitle>
            <AlertDescription>
              <p>
                Un email de vérification a été envoyé à votre nouvelle adresse.
                Veuillez vérifier votre boîte de réception et cliquer sur le lien
                pour confirmer le changement.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="newEmail"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Adresse email</FormLabel>
              <FormControl>
                <InputGroup >
                  <InputGroupAddon align="inline-start">
                    <MailIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    placeholder="nouveau@example.com"
                    {...field}
                  />
                  {getCurrentEmailQuery.data?.emailVerified && (
                    <InputGroupAddon align="inline-end">
                      <CheckIcon className="text-green-600 dark:text-green-400" />
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending || getCurrentEmailQuery.isLoading}
          className="self-start"
        >
          {isPending ? "Envoi en cours..." : "Changer l'email"}
        </Button>
      </form>
    </Form>
  );
}
