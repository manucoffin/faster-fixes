"use client";

import type { buttonVariants } from "@workspace/ui/components/button";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

type Props = {
  pending?: boolean;
} & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function ActionButton({
  children,
  disabled,
  className,
  pending = false,
  ...props
}: Props) {
  return (
    <Button
      disabled={pending || disabled}
      type="submit"
      className={cn("", className)}
      {...props}
    >
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      {children}
    </Button>
  );
}
