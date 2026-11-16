"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { GetProjectTrelloLinkOutput } from "../../../_services/get-project-trello-link";
import type { ListTrelloBoardListsOutput } from "../../../_services/list-trello-board-lists";
import {
  TrelloListMappingSchema,
  type TrelloListMappingInput,
} from "../../../_services/trello-list-mapping.schema";
import { TrelloListMappingFields } from "../trello-list-mapping-fields.client";

type ListMappingEditorProps = {
  projectId: string;
  link: NonNullable<GetProjectTrelloLinkOutput>;
  lists: ListTrelloBoardListsOutput;
};

export function ListMappingEditor({
  projectId,
  link,
  lists,
}: ListMappingEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<TrelloListMappingInput>({
    resolver: zodResolver(TrelloListMappingSchema),
    defaultValues: {
      newListId: link.newListId,
      inProgressListId: link.inProgressListId,
      resolvedListId: link.resolvedListId,
    },
  });

  const updateMutation = useMutation(
    trpc.authenticated.projects.trello.updateLink.mutationOptions({
      onSuccess: async (_, { lists: saved }) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.trello.getLink.queryKey({
            projectId,
          }),
        });
        form.reset(saved);
        toast.success("List mapping updated.");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: TrelloListMappingInput) => {
    updateMutation.mutate({ projectId, lists: data });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <TrelloListMappingFields lists={lists} />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={!form.formState.isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save lists"}
        </Button>
      </form>
    </Form>
  );
}
