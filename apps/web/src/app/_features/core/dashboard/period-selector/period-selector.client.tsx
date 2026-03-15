"use client";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { format, sub } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import * as React from "react";
import { type DateRange } from "react-day-picker";
import { periodSelectorParsers } from "./search-params";

interface PeriodSelectorProps {
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

type PredefinedPeriod = {
  label: string;
  getValue: () => DateRange;
};

const PREDEFINED_PERIODS: Record<string, PredefinedPeriod> = {
  last24h: {
    label: "Dernières 24h",
    getValue: () => ({
      from: sub(new Date(), { days: 1 }),
      to: new Date(),
    }),
  },
  last7days: {
    label: "Derniers 7 jours",
    getValue: () => ({
      from: sub(new Date(), { days: 7 }),
      to: new Date(),
    }),
  },
  last30days: {
    label: "Derniers 30 jours",
    getValue: () => ({
      from: sub(new Date(), { days: 30 }),
      to: new Date(),
    }),
  },
  last90days: {
    label: "Derniers 90 jours",
    getValue: () => ({
      from: sub(new Date(), { days: 90 }),
      to: new Date(),
    }),
  },
  last6months: {
    label: "Derniers 6 mois",
    getValue: () => ({
      from: sub(new Date(), { months: 6 }),
      to: new Date(),
    }),
  },
  last12months: {
    label: "Derniers 12 mois",
    getValue: () => ({
      from: sub(new Date(), { months: 12 }),
      to: new Date(),
    }),
  },
};

export function PeriodSelector({ onDateRangeChange }: PeriodSelectorProps) {
  const [period, setPeriod] = useQueryStates(periodSelectorParsers);
  const [open, setOpen] = React.useState(false);

  // Parse dates from URL parameters
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!period.from || !period.to) {
      // Default to last 30 days
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    }

    return {
      from: new Date(period.from),
      to: new Date(period.to),
    };
  }, [period.from, period.to]);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    if (newDateRange?.from && newDateRange?.to) {
      setPeriod({
        from: newDateRange.from.toISOString().split("T")[0],
        to: newDateRange.to.toISOString().split("T")[0],
      });
    }
    onDateRangeChange?.(newDateRange);
  };

  const handlePredefinedPeriod = (period: PredefinedPeriod) => {
    const newDateRange = period.getValue();
    handleDateRangeChange(newDateRange);
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      return "Sélectionner une période";
    }

    if (range.from.toDateString() === range.to.toDateString()) {
      return format(range.from, "d MMM yyyy", { locale: fr });
    }

    return `${format(range.from, "d MMM", { locale: fr })} - ${format(range.to, "d MMM yyyy", { locale: fr })}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="size-4" />
          {formatDateRange(dateRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Predefined periods sidebar */}
          <div className="flex flex-col gap-2 border-r p-4">
            {Object.values(PREDEFINED_PERIODS).map((p, index) => (
              <Button
                key={index}
                variant="ghost"
                className="justify-start text-sm"
                onClick={() => handlePredefinedPeriod(p)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {/* Calendar */}
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            className="rounded-lg"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
