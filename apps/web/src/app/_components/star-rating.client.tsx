"use client";

import { cn } from "@workspace/ui/lib/utils";
import { StarIcon } from "lucide-react";
import { useId, useState } from "react";

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * A 1-to-max rating. Native radio inputs carry the keyboard behaviour (Tab
 * into the group, arrow keys to move) and the accessible names; the stars are
 * their visual labels.
 */
export function StarRating({
  value,
  onChange,
  max = 5,
  name,
  className,
  ...ariaProps
}: StarRatingProps) {
  const fallbackName = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div
      role="radiogroup"
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={() => setHovered(null)}
      {...ariaProps}
    >
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        return (
          <label
            key={star}
            className="cursor-pointer rounded-sm p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            onMouseEnter={() => setHovered(star)}
          >
            <input
              type="radio"
              className="sr-only"
              name={name ?? fallbackName}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              aria-label={`${star} of ${max} stars`}
            />
            <StarIcon
              aria-hidden
              className={cn(
                "size-6 transition-colors",
                star <= shown
                  ? "fill-primary text-primary"
                  : "text-muted-foreground",
              )}
            />
          </label>
        );
      })}
    </div>
  );
}
