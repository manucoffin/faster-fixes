"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
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
  const trpc = useTRPC();
  const { data: activeOrg, refetch: refetchActiveOrg } =
    useActiveOrganization();

  const updateOrganization =
    useMutation(trpc.authenticated.organisation.update.mutationOptions({
      onSuccess: async () => {
        await refetchActiveOrg();
        toast.success("Organization updated successfully");
      },
      onError: (error) => {
        form.setError("root", {
          message:
            error.message ||
            "Error updating organization.",
        });
      },
    }));

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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Organization name"
                  disabled={updateOrganization.isPending}
                  {...field}
                />
              </FormControl>
              {slugPreview && (
                <FormDescription>Slug: {slugPreview}</FormDescription>
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
            ? "Updating..."
            : "Update"}
        </Button>
      </form>
    </Form>
  );
}
