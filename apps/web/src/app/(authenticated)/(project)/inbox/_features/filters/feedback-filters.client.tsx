"use client";

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
import * as React from "react";

type FeedbackFiltersProps = {
  pageUrls: string[];
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
  pageUrls,
  selectedPageUrl,
  onPageUrlChange,
  sort,
  onSortChange,
}: FeedbackFiltersProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-fit">
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
