import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
  iconClassName?: string;
};

export const AppLogo = ({ className, ...props }: Props) => {
  return (
    <Link href="/" className={cn("text-xl font-bold", className)} {...props}>
      Faster
      <span className="text-primary">Fixes</span>
    </Link>
  );
};
