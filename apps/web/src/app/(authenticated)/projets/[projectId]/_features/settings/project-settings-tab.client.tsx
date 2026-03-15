"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
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
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  UpdateProjectInputs,
  UpdateProjectSchema,
} from "@/app/(authenticated)/projets/_features/settings/update-project.schema";

type ProjectSettingsTabProps = {
  projectId: string;
};

export function ProjectSettingsTab({ projectId }: ProjectSettingsTabProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [newApiKey, setNewApiKey] = React.useState<string | null>(null);
  const [keyCopied, setKeyCopied] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [regenOpen, setRegenOpen] = React.useState(false);

  const { data: project } = useQuery(
    trpc.authenticated.projets.get.queryOptions({ projectId }),
  );

  const updateProject = useMutation(
    trpc.authenticated.projets.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.authenticated.projets.get.queryOptions({ projectId }),
        );
        toast.success("Projet mis à jour");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const regenerateApiKey = useMutation(
    trpc.authenticated.projets.regenerateApiKey.mutationOptions({
      onSuccess: (result) => {
        setNewApiKey(result.rawApiKey);
        setRegenOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteProject = useMutation(
    trpc.authenticated.projets.delete.mutationOptions({
      onSuccess: () => {
        router.push("/projets");
        toast.success("Projet supprimé");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<UpdateProjectInputs>({
    resolver: zodResolver(UpdateProjectSchema),
    defaultValues: {
      projectId,
      name: "",
      url: "",
      widgetColor: "#6366f1",
      widgetPosition: "bottom-right",
    },
    values: project
      ? {
          projectId,
          name: project.name,
          url: project.url,
          widgetColor: project.widgetConfig?.color ?? "#6366f1",
          widgetPosition:
            (project.widgetConfig?.position as "bottom-right" | "bottom-left") ??
            "bottom-right",
        }
      : undefined,
  });

  const onSubmit = (data: UpdateProjectInputs) => {
    updateProject.mutate(data);
  };

  const handleCopyKey = () => {
    if (!newApiKey) return;
    navigator.clipboard.writeText(newApiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-12">
      <DashboardSection
        title="Informations du projet"
        description="Modifiez le nom, l'URL et la configuration du widget."
        cardTitle="Paramètres généraux"
        cardClassName="lg:max-w-lg"
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
                <FormItem>
                  <FormLabel>Nom du projet</FormLabel>
                  <FormControl>
                    <Input disabled={updateProject.isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      disabled={updateProject.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="widgetColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur du widget</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={updateProject.isPending}
                        className="h-10 w-12 cursor-pointer rounded border"
                        {...field}
                      />
                      <Input
                        className="flex-1"
                        placeholder="#6366f1"
                        disabled={updateProject.isPending}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="widgetPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position du widget</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateProject.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bottom-right">
                        Bas droite
                      </SelectItem>
                      <SelectItem value="bottom-left">Bas gauche</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={updateProject.isPending}
              className="self-end"
            >
              {updateProject.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        </Form>
      </DashboardSection>

      <DashboardSection
        title="Clé API"
        description="Utilisée par le widget pour soumettre des retours. Seuls les 4 derniers caractères sont affichés."
        cardTitle="Clé API"
        cardClassName="lg:max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code className="flex-1 font-mono text-sm">
              ff_••••••••••••••••••••••••••••••{project?.apiKeyLastFour}
            </code>
          </div>

          {newApiKey && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="mb-2 text-xs font-medium text-destructive">
                Nouvelle clé — copiez-la maintenant, elle ne sera plus affichée.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-sm">
                  {newApiKey}
                </code>
                <Button variant="ghost" size="icon" onClick={handleCopyKey}>
                  {keyCopied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="self-start">
                <RefreshCw className="mr-2 h-4 w-4" />
                Régénérer la clé API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Régénérer la clé API ?</DialogTitle>
                <DialogDescription>
                  L&apos;ancienne clé sera immédiatement invalidée. Le widget
                  ne pourra plus soumettre de retours jusqu&apos;à ce que la
                  nouvelle clé soit configurée.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRegenOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  disabled={regenerateApiKey.isPending}
                  onClick={() => regenerateApiKey.mutate({ projectId })}
                >
                  {regenerateApiKey.isPending
                    ? "Régénération..."
                    : "Régénérer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Zone de danger"
        description="La suppression est définitive et irréversible."
        cardTitle="Supprimer le projet"
        cardClassName="lg:max-w-lg"
      >
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer le projet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le projet ?</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Tous les relecteurs, retours et
                fichiers associés seront définitivement supprimés.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                disabled={deleteProject.isPending}
                onClick={() => deleteProject.mutate({ projectId })}
              >
                {deleteProject.isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardSection>
    </div>
  );
}
