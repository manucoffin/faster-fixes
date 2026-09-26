"use client";

import { useConsentManager } from "@c15t/nextjs";
import type { buttonVariants } from "@workspace/ui/components/button";
import { Button } from "@workspace/ui/components/button";
import type { VariantProps } from "class-variance-authority";
import React from "react";

type Props = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function ManageConsentButton({
  variant = "link",
  size = "sm",
  children = "Privacy preferences",
  ...props
}: Props) {
  const { setIsPrivacyDialogOpen } = useConsentManager();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setIsPrivacyDialogOpen(true)}
      {...props}
    >
      {children}
    </Button>
  );
}
