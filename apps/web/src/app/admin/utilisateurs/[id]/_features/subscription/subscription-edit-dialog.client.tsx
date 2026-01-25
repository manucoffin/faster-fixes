"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@workspace/ui/components/action-button";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserOrganizationSelect } from "../organization-select/user-organization-select.client";
import {
  UpdateSubscriptionInputs,
  UpdateSubscriptionSchema,
} from "./subscription.schema";

interface SubscriptionEditDialogProps {
  userId: string;
  subscription: any;
}

export function SubscriptionEditDialog({
  userId,
  subscription,
}: SubscriptionEditDialogProps) {
  const subscriptionPlans = SUBSCRIPTION_PLANS.map((plan, index) => ({
    id: index + 1,
    name: plan.name,
  }));

  const trpcUtils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const updateMutation =
    trpc.admin.users.details.updateSubscription.useMutation({
      onSuccess: () => {
        toast.success("Abonnement mis à jour avec succès");
        setOpen(false);
        // Invalidate the subscription query to refetch the data
        trpcUtils.admin.users.details.getSubscription.invalidate();
      },
      onError: (error: any) => {
        toast.error(
          error.message || "Erreur lors de la mise à jour de l'abonnement",
        );
      },
    });

  const form = useForm<UpdateSubscriptionInputs>({
    resolver: zodResolver(UpdateSubscriptionSchema),
    defaultValues: {
      id: subscription?.id,
      organizationId: subscription?.organizationId || "",
      plan: (subscription?.plan as any) || subscriptionPlans[0]?.name,
      status:
        (subscription?.status as SubscriptionStatus) ||
        SubscriptionStatus.Active,
      periodStart: subscription?.periodStart
        ? new Date(subscription.periodStart)
        : undefined,
      periodEnd: subscription?.periodEnd
        ? new Date(subscription.periodEnd)
        : undefined,
      trialStart: subscription?.trialStart
        ? new Date(subscription.trialStart)
        : undefined,
      trialEnd: subscription?.trialEnd
        ? new Date(subscription.trialEnd)
        : undefined,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      // stripeCustomerId: subscription?.stripeCustomerId || "",
      // stripeSubscriptionId: subscription?.stripeSubscriptionId || "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: any) => {
    if (!data.id) {
      toast.error("ID d'abonnement manquant");
      return;
    }
    await updateMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Modifier</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;abonnement</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations d&apos;abonnement de
            l&apos;utilisateur.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Organisation */}
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation</FormLabel>
                  <FormControl>
                    <UserOrganizationSelect
                      userId={userId}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Statut d'abonnement */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SubscriptionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptionPlans.map((plan: any) => (
                        <SelectItem key={plan.name} value={plan.name}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Annulation à la fin de la période */}
            <FormField
              control={form.control}
              name="cancelAtPeriodEnd"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Annuler à la fin de la période</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Date de début */}
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date de fin */}
              <FormField
                control={form.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Période d'essai */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Début d'essai */}
              <FormField
                control={form.control}
                name="trialStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début de l&apos;essai</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fin d'essai */}
              <FormField
                control={form.control}
                name="trialEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin de l&apos;essai</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stripe Fields */}
            <div className="flex flex-col space-y-6 sm:flex-row sm:space-y-0 sm:space-x-4">
              {/* Identifiant client Stripe */}
              {/* <FormField
                control={form.control}
                name="stripeCustomerId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>ID client Stripe</FormLabel>
                    <FormControl>
                      <input
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Entrer l'ID client Stripe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Identifiant d'abonnement Stripe */}
              {/* <FormField
                control={form.control}
                name="stripeSubscriptionId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>ID d&apos;abonnement Stripe</FormLabel>
                    <FormControl>
                      <input
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Entrer l'ID d'abonnement Stripe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <DialogFooter>
              <ActionButton
                type="submit"
                disabled={!form.formState.isValid}
                pending={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
