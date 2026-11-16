"use client";

import {
  FormControl,
  FormDescription,
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
import { useFormContext } from "react-hook-form";
import type { TrelloListMappingInput } from "../../_services/trello-list-mapping.schema";
import type { ListTrelloBoardListsOutput } from "../../_services/list-trello-board-lists";

// Select items cannot carry an empty value, so the optional mapping uses a
// sentinel that the form turns back into null.
const UNMAPPED_LIST = "unmapped";

type TrelloListMappingFieldsProps = {
  lists: ListTrelloBoardListsOutput;
};

// Reads the form from context, so both the link form and the in-place mapping
// editor can render it as long as their values carry the three list fields.
export function TrelloListMappingFields({
  lists,
}: TrelloListMappingFieldsProps) {
  const { control } = useFormContext<TrelloListMappingInput>();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Choose the list that stands for each status. Moving a card into a mapped
        list updates the feedback, and changing the feedback moves the card.
      </p>

      <FormField
        control={control}
        name="newListId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>New</FormLabel>
            <ListSelect
              value={field.value}
              onValueChange={field.onChange}
              lists={lists}
            />
            <FormDescription>
              New cards are created in this list.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="inProgressListId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>In Progress</FormLabel>
            <ListSelect
              value={field.value ?? UNMAPPED_LIST}
              onValueChange={(value) =>
                field.onChange(value === UNMAPPED_LIST ? null : value)
              }
              lists={lists}
              allowUnmapped
            />
            <FormDescription>
              Optional. Without a list, the card stays where it is.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="resolvedListId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resolved</FormLabel>
            <ListSelect
              value={field.value}
              onValueChange={field.onChange}
              lists={lists}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

type ListSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  lists: ListTrelloBoardListsOutput;
  allowUnmapped?: boolean;
};

function ListSelect({
  value,
  onValueChange,
  lists,
  allowUnmapped = false,
}: ListSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select a list" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {allowUnmapped && (
          <SelectItem value={UNMAPPED_LIST}>No list</SelectItem>
        )}
        {lists.map((list) => (
          <SelectItem key={list.id} value={list.id}>
            {list.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
