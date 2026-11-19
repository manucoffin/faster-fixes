"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { SectionBody } from "../../../features/_components/section-body";
import { TrelloCardAnatomy } from "./trello-card-anatomy";

type TrelloCardTrailItem = {
  title: string;
  body: string;
};

type TrelloCardTrailProps = {
  items: TrelloCardTrailItem[];
};

// Hovering a line of the list brings its numbered markers forward on the card.
export function TrelloCardTrail({ items }: TrelloCardTrailProps) {
  const [activeNumber, setActiveNumber] = useState<number>();

  return (
    <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-[5fr_6fr] lg:gap-16">
      <TrelloCardAnatomy
        activeNumber={activeNumber}
        className="aspect-[4/3] lg:sticky lg:top-24 lg:aspect-[4/5]"
      />

      <ul
        className="flex flex-col border-t"
        onPointerLeave={() => setActiveNumber(undefined)}
      >
        {items.map((item, index) => {
          const number = index + 1;
          const isActive = activeNumber === number;

          return (
            <li
              key={item.title}
              className="flex gap-4 border-b py-6 md:py-7"
              onPointerEnter={() => setActiveNumber(number)}
            >
              {/* Matches the numbered marker on the card illustration */}
              <span
                aria-hidden
                className={cn(
                  "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] leading-none font-semibold text-primary-foreground tabular-nums transition-shadow duration-200 motion-reduce:transition-none",
                  isActive && "ring-4 ring-primary/25",
                )}
              >
                {number}
              </span>
              <div>
                <h3 className="text-lg font-medium">{item.title}</h3>
                <SectionBody className="mt-2 text-base">
                  <p>{item.body}</p>
                </SectionBody>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
