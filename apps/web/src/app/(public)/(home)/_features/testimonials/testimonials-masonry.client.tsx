"use client";

import { layout, prepare } from "@chenglou/pretext";
import { cn } from "@workspace/ui/lib/utils";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { distributeIntoColumns } from "../../_helpers/distribute-into-columns";

// Mirror the card classes: `gap-6`, and `p-7` plus a 1px border per side.
const GAP_PX = 24;
const CARD_HORIZONTAL_CHROME_PX = 58;
// Stars, spacing, divider and author row are the same on every card, so only
// the quote decides how cards balance across columns.
const CARD_VERTICAL_CHROME_PX = 180;

type TestimonialsMasonryItem = {
  id: string;
  text: string;
  card: ReactNode;
};

type TestimonialsMasonryProps = {
  items: TestimonialsMasonryItem[];
};

type Viewport = {
  width: number;
  columnCount: number;
};

type QuoteStyle = {
  font: string;
  lineHeight: number;
};

export function TestimonialsMasonry({ items }: TestimonialsMasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setViewport({
        width: entry.contentRect.width,
        columnCount: readBreakpointColumnCount(),
      });
    });
    observer.observe(container);

    // Measuring before the web font loads would use the fallback's metrics.
    void document.fonts.ready.then(() => {
      const quote = container.querySelector("[data-testimonial-text]");
      if (!quote) return;
      const style = getComputedStyle(quote);
      setQuoteStyle({
        font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        lineHeight: Number.parseFloat(style.lineHeight),
      });
    });

    return () => observer.disconnect();
  }, []);

  const preparedQuotes = useMemo(
    () =>
      quoteStyle
        ? items.map((item) =>
            // The card renders `whitespace-pre-line`: newlines kept, spaces collapsed.
            prepare(item.text.replace(/[ \t]+/g, " "), quoteStyle.font, {
              whiteSpace: "pre-wrap",
            }),
          )
        : null,
    [items, quoteStyle],
  );

  const columns = useMemo(() => {
    if (!preparedQuotes || !quoteStyle || !viewport) return null;

    const columnCount = Math.min(viewport.columnCount, items.length);
    const columnWidth =
      (viewport.width - GAP_PX * (columnCount - 1)) / columnCount;
    const heights = preparedQuotes.map(
      (prepared) =>
        layout(
          prepared,
          columnWidth - CARD_HORIZONTAL_CHROME_PX,
          quoteStyle.lineHeight,
        ).height + CARD_VERTICAL_CHROME_PX,
    );

    return distributeIntoColumns(heights, columnCount);
  }, [items.length, preparedQuotes, quoteStyle, viewport]);

  return (
    <div
      ref={containerRef}
      className={cn("mx-auto mt-12", getMaxWidthClass(items.length))}
    >
      {columns ? (
        <div className="flex items-start gap-6">
          {columns.map((indexes, columnIndex) => (
            <ul
              key={columnIndex}
              className="flex min-w-0 flex-1 flex-col gap-6"
            >
              {indexes.map((index) => (
                <li key={items[index]?.id}>{items[index]?.card}</li>
              ))}
            </ul>
          ))}
        </div>
      ) : (
        // Server render and first paint, until the quotes are measured.
        <ul className={cn("gap-6", getFallbackColumnsClass(items.length))}>
          {items.map((item) => (
            <li key={item.id} className="mb-6 break-inside-avoid">
              {item.card}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Same breakpoints as the fallback's `md:` and `lg:` classes.
function readBreakpointColumnCount() {
  if (window.matchMedia("(min-width: 64rem)").matches) return 3;
  if (window.matchMedia("(min-width: 48rem)").matches) return 2;
  return 1;
}

// One or two cards keep a card's width and stay centered.
function getMaxWidthClass(count: number) {
  if (count === 1) return "max-w-md";
  if (count === 2) return "max-w-3xl";
  return "max-w-6xl";
}

function getFallbackColumnsClass(count: number) {
  if (count === 1) return "columns-1";
  if (count === 2) return "md:columns-2";
  return "md:columns-2 lg:columns-3";
}
