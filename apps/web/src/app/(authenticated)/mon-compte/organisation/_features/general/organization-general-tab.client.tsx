"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { organization, useActiveOrganization } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
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
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  UpdateOrganizationInputs,
  UpdateOrganizationSchema,
} from "./update-organization.schema";
import { DeleteOrganizationSection } from "./delete-organization-section.client";
import { OrganizationLogoUpload } from "./organization-logo-upload.client";

export function OrganizationGeneralTab() {
  const { data: activeOrg } = useActiveOrganization();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<UpdateOrganizationInputs>({
    resolver: zodResolver(UpdateOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  React.useEffect(() => {
    if (activeOrg) {
      form.reset({
        name: activeOrg.name ?? "",
        slug: activeOrg.slug ?? "",
      });
    }
  }, [activeOrg, form]);

  const onSubmit = async (data: UpdateOrganizationInputs) => {
    if (!activeOrg) return;

    setIsPending(true);
    try {
      const result = await organization.update({
        organizationId: activeOrg.id,
        data: { name: data.name, slug: data.slug },
      });

      if (result.error) {
        form.setError("root", {
          message:
            result.error.message ||
            "Erreur lors de la mise à jour de l'organisation.",
        });
        return;
      }

      toast.success("Organisation mise à jour avec succès");
    } catch {
      form.setError("root", {
        message: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <DashboardSection
        title="Logo"
        description="Changez le logo de votre organisation"
        cardTitle="Logo de l'organisation"
      >
        <OrganizationLogoUpload />
      </DashboardSection>

      <DashboardSection
        title="Informations générales"
        description="Mettez à jour le nom et le slug de votre organisation"
        cardTitle="Informations de l'organisation"
      >
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
                <FormItem className="max-w-sm">
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom de l'organisation"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="max-w-sm">
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mon-organisation"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="self-start"
            >
              {isPending
                ? "Mise à jour en cours..."
                : "Mettre à jour"}
            </Button>
          </form>
        </Form>
      </DashboardSection>

      <DashboardSection
        title="Supprimer l'organisation"
        description="Supprimez définitivement cette organisation et toutes ses données"
        cardTitle="Zone de danger"
      >
        <DeleteOrganizationSection />
      </DashboardSection>
    </div>
  );
}
