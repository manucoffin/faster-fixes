import { JSXConverters } from "@payloadcms/richtext-lexical/react";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import Link from "next/link";

type ButtonSize = "small" | "default" | "large";
type ButtonPosition = "left" | "center" | "right";
type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

const sizeMap: Record<ButtonSize, ButtonVariantProps["size"]> = {
  small: "sm",
  default: "default",
  large: "lg",
};

const variantMap: Record<ButtonVariant, ButtonVariantProps["variant"]> = {
  default: "default",
  destructive: "destructive",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  link: "link",
};

const positionClasses: Record<ButtonPosition, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const buttonBlockTextVariants = cva("", {
  variants: {
    size: {
      small: "text-sm",
      default: "text-base",
      large: "text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export const buttonBlockConverter: JSXConverters<any> = {
  richTextButton: ({ node }) => {
    const { text, link, position, size, variant } = node.fields;

    if (!text || !link) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            Button block is missing required fields (text or link)
          </p>
        </div>
      );
    }

    const buttonSize = sizeMap[size as ButtonSize] || "default";
    const buttonVariant = variantMap[variant as ButtonVariant] || "default";
    const alignmentClass =
      positionClasses[position as ButtonPosition] || "justify-center";
    const textClasses = buttonBlockTextVariants({ size: size as ButtonSize });

    return (
      <div
        className={cn(
          "button-block not-prose flex w-full py-4",
          alignmentClass,
        )}
      >
        <Button
          size={buttonSize}
          variant={buttonVariant}
          asChild
          className={cn(textClasses, "h-auto w-fit")}
        >
          <Link href={link}><span className="text-wrap text-center">{text}</span></Link>
        </Button>
      </div>
    );
  },
};
