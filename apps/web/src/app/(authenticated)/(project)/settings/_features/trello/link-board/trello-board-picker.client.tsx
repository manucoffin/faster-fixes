"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  LinkTrelloBoardSchema,
  type LinkTrelloBoardInput,
} from "../../../_services/link-trello-board.schema";
import type { ListAccessibleTrelloBoardsOutput } from "../../../_services/list-accessible-trello-boards";
import { TrelloListMappingFields } from "../trello-list-mapping-fields.client";

type TrelloBoardPickerProps = {
  projectId: string;
  boards: ListAccessibleTrelloBoardsOutput;
};

export function TrelloBoardPicker({
  projectId,
  boards,
}: TrelloBoardPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<LinkTrelloBoardInput>({
    resolver: zodResolver(LinkTrelloBoardSchema),
    defaultValues: {
      projectId,
      boardId: "",
      boardName: "",
      boardUrl: "",
      newListId: "",
      inProgressListId: null,
      resolvedListId: "",
    },
  });

  const boardId = useWatch({ control: form.control, name: "boardId" });

  const listsQuery = useQuery(
    trpc.authenticated.projects.trello.listBoardLists.queryOptions(
      { projectId, boardId },
      { enabled: !!boardId },
    ),
  );

  const linkMutation = useMutation(
    trpc.authenticated.projects.trello.linkBoard.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.trello.getLink.queryKey({
            projectId,
          }),
        });
        toast.success("Trello board linked.");
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (data: LinkTrelloBoardInput) => {
    linkMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="boardId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trello board</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const board = boards.find((b) => b.id === value);
                  if (!board) return;
                  field.onChange(board.id);
                  form.setValue("boardName", board.name);
                  form.setValue("boardUrl", board.url);
                  // Lists belong to a board; the previous mapping does not
                  // exist on the new one.
                  form.setValue("newListId", "");
                  form.setValue("inProgressListId", null);
                  form.setValue("resolvedListId", "");
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Trello board" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {boardId &&
          matchQueryStatus(listsQuery, {
            Loading: <Skeleton className="h-40 w-full" />,
            Errored: (error) => (
              <Alert variant="destructive">
                <AlertTitle>Failed to load the board lists</AlertTitle>
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            ),
            Empty: (
              <p className="text-sm text-muted-foreground">
                This Trello board has no open list. Add lists in Trello, then
                come back to map them.
              </p>
            ),
            Success: ({ data: lists }) => (
              <TrelloListMappingFields lists={lists} />
            ),
          })}

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={linkMutation.isPending}
          className="w-fit"
        >
          {linkMutation.isPending ? "Linking..." : "Link Trello board"}
        </Button>
      </form>
    </Form>
  );
}
