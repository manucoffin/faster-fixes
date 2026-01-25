"use client";

import { Button, buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { VariantProps } from "class-variance-authority";
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
  pending,
  ...props
}: Props) {
  return (
    <Button
      disabled={pending || disabled}
      type="submit"
      className={cn("", className)}
      {...props}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
