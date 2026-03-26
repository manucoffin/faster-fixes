import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
  iconClassName?: string;
};

export const AppLogo = ({ className, ...props }: Props) => {
  return (
    <Link
      href="/"
      className={cn(
        "dark:hover:text-primary-foreground hover:text-foreground font-medium transition-colors",
        className,
      )}
      {...props}
    >
      /fasterfixes
    </Link>
  );
};

type AppLogoMarkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  className?: string;
};

export const AppLogoMark = ({ className, ...props }: AppLogoMarkProps) => {
  return (
    <Link
      href="/"
      className={cn(
        "dark:hover:text-primary-foreground hover:text-foreground font-medium transition-colors",
        className,
      )}
      {...props}
    >
      /ff
    </Link>
  );
};
