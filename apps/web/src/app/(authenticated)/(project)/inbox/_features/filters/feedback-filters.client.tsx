"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
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
import type { BoardSort } from "../../_helpers/board-column-order";
import {
  type BoardSource,
  parseBoardSource,
  serializeBoardSource,
} from "../../_helpers/board-source";
import type { ListSourcesOutput } from "../../_services/list-sources";

type FeedbackFiltersProps = {
  projectId: string;
  source: BoardSource;
  onSourceChange: (source: BoardSource) => void;
  sort: BoardSort;
  onSortChange: (sort: BoardSort) => void;
};

// `value` is the serialized `source` parameter.
type SourceOption = { value: string; label: string };
type SourceGroup = { value: string; items: SourceOption[] };

function formatPageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname + parsed.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function toSourceGroups({ pageUrls, videos }: ListSourcesOutput) {
  const groups: SourceGroup[] = [
    {
      value: "All",
      items: [
        { value: "pages", label: "All pages" },
        { value: "videos", label: "All videos" },
      ],
    },
    {
      value: "Pages",
      items: pageUrls.map((url) => ({
        value: serializeBoardSource({ kind: "page", url }),
        label: formatPageUrl(url),
      })),
    },
    {
      value: "Videos",
      items: videos.map((video) => ({
        value: serializeBoardSource({ kind: "video", videoId: video.id }),
        label: video.title,
      })),
    },
  ];
  return groups.filter((group) => group.items.length > 0);
}

export function FeedbackFilters({
  projectId,
  source,
  onSourceChange,
  sort,
  onSortChange,
}: FeedbackFiltersProps) {
  const trpc = useTRPC();

  const sourcesQuery = useQuery(
    trpc.authenticated.projects.feedback.listSources.queryOptions({
      projectId,
    }),
  );
  const selectedValue = serializeBoardSource(source);

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-fit">
      {/* The picker owns the source list, so a failed read says so rather
          than offering a filter with nothing in it. The sort select stays
          available in every state: it needs no read of its own. */}
      {matchQueryStatus(sourcesQuery, {
        Loading: <Skeleton className="h-9 w-full sm:w-[250px]" />,
        Errored: (
          <p className="text-sm text-destructive">
            Failed to load the source filter.
          </p>
        ),
        Empty: <></>,
        Success: ({ data: sources }) => {
          const groups = toSourceGroups(sources);
          const selected =
            groups
              .flatMap((group) => group.items)
              .find((option) => option.value === selectedValue) ?? null;

          return (
            <Combobox
              items={groups}
              value={selected}
              onValueChange={(option: SourceOption | null) =>
                onSourceChange(parseBoardSource(option?.value ?? null))
              }
              isItemEqualToValue={(a, b) => a?.value === b?.value}
            >
              <ComboboxInput
                placeholder="Filter by source"
                showTrigger
                showClear={!!selected}
                className="w-full sm:w-[250px]"
              />
              <ComboboxContent>
                <ComboboxEmpty>No sources found.</ComboboxEmpty>
                <ComboboxList>
                  {(group: SourceGroup) => (
                    <ComboboxGroup key={group.value} items={group.items}>
                      {group.value !== "All" && (
                        <ComboboxLabel>{group.value}</ComboboxLabel>
                      )}
                      <ComboboxCollection>
                        {(option: SourceOption) => (
                          <ComboboxItem key={option.value} value={option}>
                            <span className="truncate">{option.label}</span>
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxGroup>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          );
        },
      })}

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">Manual</SelectItem>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="updated">Recently updated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
