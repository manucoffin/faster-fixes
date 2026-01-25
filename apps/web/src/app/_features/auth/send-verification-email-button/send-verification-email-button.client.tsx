"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { ActionButton } from "@workspace/ui/components/action-button";
import { buttonVariants } from "@workspace/ui/components/button";
import { VariantProps } from "class-variance-authority";
import { ReactNode } from "react";
import { toast } from "sonner";
import { SendVerificationEmailSchema } from "./send-verification-email.schema";

type SendVerificationEmailButtonProps = {
  email: string;
  className?: string;
  children?: ReactNode;
} & VariantProps<typeof buttonVariants>;

export function SendVerificationEmailButton({
  email,
  className,
  children = "Envoyer l'email de vérification",
  variant = "secondary",
  size,
}: SendVerificationEmailButtonProps) {
  const sendVerificationEmailMutation =
    trpc.auth.sendVerificationEmail.useMutation();

  const handleSendVerificationEmail = () => {
    try {
      // Validate email input
      const validatedInput = SendVerificationEmailSchema.parse({ email });

      sendVerificationEmailMutation.mutate(validatedInput, {
        onSuccess: () => {
          toast.success("Email de vérification envoyé avec succès");
        },
        onError: (error) => {
          toast.error(
            error?.message ||
            "Une erreur est survenue lors de l'envoi de l'email",
          );
        },
      });
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Une erreur est survenue lors de la validation de l'email",
      );
    }
  };

  return (
    <ActionButton
      variant={variant}
      size={size}
      onClick={handleSendVerificationEmail}
      className={className}
      disabled={sendVerificationEmailMutation.isPending}
      pending={sendVerificationEmailMutation.isPending}
    >
      {children}
    </ActionButton>
  );
}
