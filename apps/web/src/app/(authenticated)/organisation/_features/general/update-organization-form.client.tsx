"use client";

import { useActiveOrganization } from "@/lib/auth";
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
import { toast } from "sonner";
import slugify from "slugify";
import {
  UpdateOrganizationInputs,
  UpdateOrganizationSchema,
} from "./update-organization.schema";

export function UpdateOrganizationForm() {
  const { data: activeOrg, refetch: refetchActiveOrg } =
    useActiveOrganization();

  const updateOrganization =
    trpc.authenticated.account.organisation.update.useMutation({
      onSuccess: async () => {
        await refetchActiveOrg();
        toast.success("Organisation mise à jour avec succès");
      },
      onError: (error) => {
        form.setError("root", {
          message:
            error.message ||
            "Erreur lors de la mise à jour de l'organisation.",
        });
      },
    });

  const form = useForm<UpdateOrganizationInputs>({
    resolver: zodResolver(UpdateOrganizationSchema),
    defaultValues: {
      organizationId: "",
      name: "",
    },
    values: activeOrg
      ? { organizationId: activeOrg.id, name: activeOrg.name ?? "" }
      : undefined,
  });

  const nameValue = form.watch("name");
  const slugPreview = React.useMemo(
    () => slugify(nameValue, { lower: true, strict: true }),
    [nameValue],
  );

  const onSubmit = (data: UpdateOrganizationInputs) => {
    updateOrganization.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nom de l'organisation"
                  disabled={updateOrganization.isPending}
                  {...field}
                />
              </FormControl>
              {slugPreview && (
                <FormDescription>Slug : {slugPreview}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateOrganization.isPending}
          className="self-end"
        >
          {updateOrganization.isPending
            ? "Mise à jour en cours..."
            : "Mettre à jour"}
        </Button>
      </form>
    </Form>
  );
}
