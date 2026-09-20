"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import * as React from "react";

type FeedbackFiltersProps = {
  projectId: string;
  selectedPageUrl: string | null;
  onPageUrlChange: (url: string | null) => void;
  sort: string;
  onSortChange: (sort: string) => void;
};

function formatPageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname + parsed.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function FeedbackFilters({
  projectId,
  selectedPageUrl,
  onPageUrlChange,
  sort,
  onSortChange,
}: FeedbackFiltersProps) {
  const trpc = useTRPC();

  const pageUrlsQuery = useQuery(
    trpc.authenticated.projects.feedback.listDistinctPageUrls.queryOptions({
      projectId,
    }),
  );

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-fit">
      {/* The picker owns the page list, so a failed read says so rather than
          offering a filter with nothing in it. The sort select stays available
          in every state: it needs no read of its own. */}
      {matchQueryStatus(pageUrlsQuery, {
        Loading: <Skeleton className="h-9 w-full sm:w-[250px]" />,
        Errored: (
          <p className="text-sm text-destructive">
            Failed to load the page filter.
          </p>
        ),
        // No feedback on any page yet: there is nothing to filter by.
        Empty: <></>,
        Success: ({ data: pageUrls }) => (
          <Combobox
            items={pageUrls}
            value={selectedPageUrl}
            onValueChange={(value) => onPageUrlChange(value)}
            itemToStringValue={formatPageUrl}
          >
            <ComboboxInput
              placeholder="Filter by page"
              showTrigger
              showClear={!!selectedPageUrl}
              className="w-full sm:w-[250px]"
            />
            <ComboboxContent>
              <ComboboxEmpty>No pages found.</ComboboxEmpty>
              <ComboboxList>
                {(url) => (
                  <ComboboxItem key={url} value={url}>
                    <span className="truncate">{formatPageUrl(url)}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        ),
      })}

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="updated">Recently updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
