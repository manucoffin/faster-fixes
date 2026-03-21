"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
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
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between"
          >
            {selectedPageUrl ? (
              <span className="truncate">{formatPageUrl(selectedPageUrl)}</span>
            ) : (
              <span className="text-muted-foreground">Filter by page</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search pages..." />
            <CommandList>
              <CommandEmpty>No pages found.</CommandEmpty>
              <CommandGroup>
                {pageUrls.map((url) => (
                  <CommandItem
                    key={url}
                    value={url}
                    onSelect={() => {
                      onPageUrlChange(selectedPageUrl === url ? null : url);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selectedPageUrl === url ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{formatPageUrl(url)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedPageUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageUrlChange(null)}
          className="h-8 px-2"
        >
          <X className="size-4" />
        </Button>
      )}

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[160px]">
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
