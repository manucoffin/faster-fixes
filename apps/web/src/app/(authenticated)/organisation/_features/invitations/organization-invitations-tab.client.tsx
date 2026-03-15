"use client";

import { getRoleLabel } from "@/app/_features/organization/_utils/organization-roles";
import { organization, useActiveOrganization } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  CreateInvitationInputs,
  CreateInvitationSchema,
} from "./create-invitation.schema";

export function OrganizationInvitationsTab() {
  const { data: activeOrg } = useActiveOrganization();
  const [invitations, setInvitations] = React.useState<
    Array<{
      id: string;
      email: string;
      role: string;
      status: string;
      expiresAt: Date;
    }>
  >([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = React.useState(true);
  const [isPending, setIsPending] = React.useState(false);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const form = useForm<CreateInvitationInputs>({
    resolver: zodResolver(CreateInvitationSchema),
    defaultValues: { email: "", role: "member" },
  });

  const loadInvitations = React.useCallback(async () => {
    if (!activeOrg?.id) return;
    setIsLoadingInvitations(true);
    try {
      const result = await organization.listInvitations({
        query: { organizationId: activeOrg.id },
      });
      if (result.data) {
        setInvitations(result.data as typeof invitations);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [activeOrg?.id]);

  React.useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const onSubmit = async (data: CreateInvitationInputs) => {
    if (!activeOrg) return;

    setIsPending(true);
    try {
      const result = await organization.inviteMember({
        organizationId: activeOrg.id,
        email: data.email,
        role: data.role,
      });

      if (result.error) {
        form.setError("root", {
          message:
            result.error.message || "Erreur lors de l'envoi de l'invitation.",
        });
        return;
      }

      toast.success("Invitation envoyée avec succès");
      form.reset();
      loadInvitations();
    } catch {
      form.setError("root", {
        message: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      const result = await organization.cancelInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(
          result.error.message ||
            "Erreur lors de l'annulation de l'invitation.",
        );
        return;
      }

      toast.success("Invitation annulée");
      loadInvitations();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setCancellingId(null);
    }
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Inviter un membre</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-end gap-4"
          >
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1 max-w-sm">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
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
              name="role"
              render={({ field }) => (
                <FormItem className="w-48">
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="member">Membre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? "Envoi en cours..." : "Inviter"}
            </Button>
          </form>
        </Form>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Invitations en attente</h3>

        {isLoadingInvitations ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : pendingInvitations.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aucune invitation en attente</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getRoleLabel(invitation.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={cancellingId === invitation.id}
                      onClick={() => handleCancel(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
